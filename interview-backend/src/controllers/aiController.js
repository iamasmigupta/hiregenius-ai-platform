const { GoogleGenerativeAI } = require("@google/generative-ai");
const stringSimilarity = require('string-similarity');
const config = require('../config');

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(config.geminiAPIKey);

// --- Task-Specific AI Configurations ---
const questionGenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};
const answerAnalysisConfig = {
  temperature: 0.0,
  maxOutputTokens: 4096,
};

async function generateInterviewFromJD(jobDescription, numberOfQuestions, resumeText = '') {
  console.log(`Generating ${numberOfQuestions} questions for job description: "${jobDescription?.substring(0, 80)}..."${resumeText ? ' (with resume)' : ''}`);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: questionGenerationConfig });

  const resumeSection = resumeText ? `
    IMPORTANT: A candidate's resume has been provided. You MUST tailor questions to probe the candidate's specific experience, skills, and projects mentioned in their resume while also covering the requirements of the job description. Ask questions that connect their past experience to the role's needs.

    Here is the Candidate's Resume:
    ${resumeText}
  ` : '';

  const prompt = `
    You are an expert technical recruiter. Your task is to create a structured interview based on the provided job description.
    ${resumeText ? 'The interview questions should be personalized based on the candidate\'s resume AND the job requirements.' : ''}
    Generate exactly ${numberOfQuestions} diverse questions.
    For each question, you MUST provide the following fields in a valid JSON object:
    - "questionText": The full text of the question.
    - "questionType": One of "technical", "behavioral", or "situational".
    - "difficulty": One of "easy", "medium", or "hard".
    - "timeLimitSeconds": An appropriate time limit in seconds (e.g., 180 for easy, 300 for medium, 450 for hard).
    - "idealAnswer": A detailed, expert-level ideal answer to the question.
    - "keywords": An array of 5-10 essential keywords or concepts from the ideal answer for scoring.
    Your entire response MUST be a single, valid JSON array of these question objects, with no surrounding text or markdown.

    Here is the Job Description:
    ${jobDescription}
    ${resumeSection}
  `;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating interview from AI:", error.message || error);
    throw new Error("Failed to generate interview questions from the provided job description.");
  }
}

const processAnswer = async (userTranscription, questionDetails) => {
  const coreConcepts = questionDetails.keywords;
  const conceptAnalysis = await getSemanticConceptAnalysis(userTranscription, coreConcepts);

  // --- SCORE CALCULATION (0-1 scale) ---
  const aiKeywordScoreDecimal = conceptAnalysis.mentionedConcepts.length / (coreConcepts.length || 1);
  const semanticDiceScoreDecimal = stringSimilarity.compareTwoStrings(userTranscription.toLowerCase(), questionDetails.idealAnswer.toLowerCase());

  // --- WEIGHTED AVERAGE (0-1 scale) ---
  const weights = { keyword: 0.95, semantic: 0.05 };
  const finalWeightedScoreDecimal = (aiKeywordScoreDecimal * weights.keyword) + (semanticDiceScoreDecimal * weights.semantic);
  
  // --- CONVERT ALL SCORES TO PERCENTAGES (0-100 scale) for the frontend ---
  const finalWeightedScore = finalWeightedScoreDecimal * 100;
  const aiKeywordScore = aiKeywordScoreDecimal * 100;
  const semanticDiceScore = semanticDiceScoreDecimal * 100;

  // --- DETERMINE VERDICT ---
  const CORRECTNESS_THRESHOLD = 65; // A score of 65% or higher is considered correct.
  const isCorrect = finalWeightedScore >= CORRECTNESS_THRESHOLD;

  return {
    isCorrect, // Add the boolean verdict
    finalWeightedScore: finalWeightedScore,
    detailedAnalysis: {
      scoreBreakdown: { 
          'AI Keyword Score': aiKeywordScore, 
          'Semantic Similarity': semanticDiceScore 
      },
      feedbackFromAI: { 
          conceptsMentioned: conceptAnalysis.mentionedConcepts, 
          conceptsMissed: conceptAnalysis.missedConcepts 
      },
      userTranscription: userTranscription,
      idealAnswer: questionDetails.idealAnswer
    },
  };
};

async function getSemanticConceptAnalysis(userAnswer, keyConcepts) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: answerAnalysisConfig });
  const prompt = `
    You are a precise AI teaching assistant. Your only job is to determine which of the provided "Key Concepts" are semantically present in the "User's Answer".
    Your entire response must be ONLY the required JSON object, without any markdown.
    User's Answer: "${userAnswer}"
    Key Concepts to check for: ${JSON.stringify(keyConcepts)}
    Respond with a pure JSON object: { "mentionedConcepts": [], "missedConcepts": [] }
  `;
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n|```/g, '').trim();
  return JSON.parse(text);
}

async function generateFinalReport(responses) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: answerAnalysisConfig });
    const simplifiedResponses = responses.map(r => ({
        question: r.questionText, // Including question text for better context
        score: r.aiScore,
        feedback: r.aiFeedback,
        transcribedText: r.transcribedText, // The candidate's actual answer
    }));
    
    const prompt = `
        You are an expert HR analyst and technical interviewer. Your task is to provide a comprehensive and detailed evaluation of a candidate based on their interview responses.
        Analyze the provided interview data, which includes the question, the candidate's transcribed answer, the score (out of 100), and AI-generated feedback for each response.
         - If it is completely irrelevant to the job description or the question, you should return a score of 0.
        Your entire response MUST be a single, valid JSON object, with no surrounding text or markdown.
        The JSON object must have the following structure and keys:

        {
          "strengths": [
            "A bulleted list of 3-4 key strengths demonstrated by the candidate."
          ],
          "areasForImprovement": [
            "A bulleted list of 3-4 concrete areas where the candidate can improve."
          ],
          "recommendation": "A single string, which must be one of 'strong_hire', 'hire', 'maybe', or 'no_hire'.",
          "skillScores": {
            "technical": "A score (0-100) for overall technical proficiency.",
            "communication": "A score (0-100) for clarity, and professional dialogue.",
            "behavioral": "A score (0-100) assessing attitude and situational responses.",
            "problemSolving": "A score (0-100) for analytical skills and solution approaches."
          },
          "detailedAnalysis": [
            {
              "skill": "Technical Knowledge",
              "score": "Score (0-100) for this specific skill.",
              "description": "A 1-2 sentence summary of their performance in this area."
            },
            {
              "skill": "Subject Knowledge",
              "score": "Score (0-100) for this specific skill.",
              "description": "A 1-2 sentence summary of their performance in this area."
            },
            {
              "skill": "Communication",
              "score": "Score (0-100) for this specific skill.",
              "description": "A 1-2 sentence summary of their performance in this area."
            }
          ],
          "interviewSummary": "A concise, professional paragraph summarizing the candidate's overall performance.",
          "feedback": "A constructive feedback paragraph for the candidate, highlighting both strengths and areas for growth.",
          "recommendations": "A paragraph with actionable recommendations for the hiring manager (e.g., 'Strong hire for a mid-level role', 'Consider for a junior position', etc.)."
        }

        Here is the interview data:
        ${JSON.stringify(simplifiedResponses, null, 2)}

        Now, provide the complete, structured evaluation in the required JSON format.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n|```/g, '').trim();
    return JSON.parse(text);
}

module.exports = {
    generateInterviewFromJD,
    processAnswer,
    generateFinalReport,
};