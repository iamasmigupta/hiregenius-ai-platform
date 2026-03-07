const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config');

/**
 * Transcribes an audio file using the configured Whisper API provider.
 * @param {string} audioFilePath - The absolute path to the audio file to be transcribed.
 * @returns {Promise<string>} - A promise that resolves to the transcribed text.
 * @throws Will throw an error if the API call fails or returns an invalid response.
 */
const transcribeAudio = async (audioFilePath) => {
    try {
        const form = new FormData();
        form.append('model', 'whisper-large-v3');
        form.append('file', fs.createReadStream(audioFilePath));
        
        // --- KEY CHANGE ---
        // Add the language parameter to force English transcription.
        // This will transliterate other languages (like Hindi) into Roman script.
        form.append('language', 'en');

        const headers = {
            ...form.getHeaders(),
            'Authorization': `Bearer ${config.groqApiKey}`
        };

        console.log(`Sending transcription request for ${audioFilePath} with language set to 'en'...`);

        const response = await axios.post(config.whisperApiUrl, form, { headers });

        if (response.data && response.data.text) {
            console.log('Transcription successful.');
            return response.data.text;
        } else {
            throw new Error('Invalid response structure from transcription API.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Transcription API Error:', error.response.status, error.response.data);
            throw new Error(`Transcription API failed: ${error.response.data.error.message}`);
        } else {
            console.error('Transcription Request Error:', error.message);
            throw new Error('Failed to make a request to the transcription service.');
        }
    } finally {
        // to delete the temporary audio file after transcription
        // fs.unlink(audioFilePath, (err) => {
        //     if (err) {
        //         console.error(`Failed to delete temporary audio file: ${audioFilePath}`, err);
        //     }
        // });
    }
};

module.exports = { transcribeAudio };