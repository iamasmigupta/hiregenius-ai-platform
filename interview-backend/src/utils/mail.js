const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('../config');

// Create transporter using credentials from .env
const transporter = nodemailer.createTransport(
  smtpTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // uses STARTTLS
    auth: {
      user: config.senderEmail,
      pass: config.senderPassword,
    }
  })
);

// Reusable styling constants
const mailStyles = {
  backgroundColor: '#121212',
  fontFamily: 'Arial, sans-serif',
  textColor: '#E0E0E0',
  accentColor: '#FFE066',
  buttonTextColor: '#181818',
  borderColor: '#333333',
  borderRadius: '8px',
};

const mainContainerStyle = `background-color: ${mailStyles.backgroundColor}; padding: 40px;`;
const contentWrapperStyle = `max-width: 600px; margin: 0 auto; background-color: #1E1E1E; border: 1px solid ${mailStyles.borderColor}; border-radius: ${mailStyles.borderRadius}; overflow: hidden;`;
const headerStyle = `background-color: #252525; padding: 20px 30px; text-align: center; border-bottom: 1px solid ${mailStyles.borderColor};`;
const headerTextStyle = `color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0;`;
const bodyStyle = `padding: 30px; color: ${mailStyles.textColor}; line-height: 1.6;`;
const buttonStyle = `display: inline-block; padding: 12px 24px; background-color: ${mailStyles.accentColor}; color: ${mailStyles.buttonTextColor}; text-decoration: none; border-radius: 6px; font-weight: bold;`;
const footerStyle = `text-align: center; font-size: 12px; color: #777777; padding: 20px 30px; border-top: 1px solid ${mailStyles.borderColor};`;

/**
 * Generic mail sending function
 * @param {object} mailOptions - Nodemailer mail options
 */
const sendMail = async (mailOptions) => {
  try {
    const baseOptions = {
      from: `"HireGenius" <${config.senderEmail}>`
    };
    await transporter.sendMail({ ...baseOptions, ...mailOptions });
    console.log(`Email sent successfully to ${mailOptions.to}`);
  } catch (error) {
    console.error(`Failed to send email to ${mailOptions.to}:`, error);
    // In a production app, you'd want more robust error handling, e.g., logging to a service
  }
};

/**
 * Sends an interview invitation email to a candidate.
 * @param {string} to - Candidate's email address
 * @param {string} link - Unique interview link
 * @param {string} candidateName - Candidate's first name
 */
const sendInviteEmail = async (to, link, candidateName) => {
  const mailOptions = {
    to,
    subject: 'Your AI Interview Invitation',
    html: `
      <div style="${mainContainerStyle}">
        <div style="${contentWrapperStyle}">
          <div style="${headerStyle}"><h1 style="${headerTextStyle}">HireGenius</h1></div>
          <div style="${bodyStyle}">
            <h2 style="color: #FFFFFF;">Hello ${candidateName},</h2>
            <p>You have been invited to participate in an AI-powered interview. Please click the button below to begin.</p>
            <p style="margin: 30px 0;"><a href="${link}" style="${buttonStyle}">Begin Interview</a></p>
            <p>If you encounter any issues, please contact the hiring manager.</p>
            <p>Best of luck!</p>
          </div>
          <div style="${footerStyle}">  ${new Date().getFullYear()} | HireGenius</div>
        </div>
      </div>
    `
  };
  await sendMail(mailOptions);
};

/**
 * Sends a notification to the recruiter when a candidate's report is ready.
 * @param {string} to - Recruiter's email address
 * @param {string} reportLink - Link to the detailed report
 * @param {string} candidateName - The name of the candidate who completed the interview
 */
const sendReportEmail = async (to, reportLink, candidateName) => {
  const mailOptions = {
    to,
    subject: `AI Interview Report for ${candidateName} is Ready`,
    html: `
      <div style="${mainContainerStyle}">
        <div style="${contentWrapperStyle}">
          <div style="${headerStyle}"><h1 style="${headerTextStyle}">Report Ready</h1></div>
          <div style="${bodyStyle}">
            <p>The automated interview report for <strong>${candidateName}</strong> has been generated and is now available for your review.</p>
            <p style="margin: 30px 0;"><a href="${reportLink}" style="${buttonStyle}">View Report</a></p>
          </div>
          <div style="${footerStyle}">© ${new Date().getFullYear()} HireGenius. All Rights Reserved.</div>
        </div>
      </div>
    `
  };
  await sendMail(mailOptions);
};

/**
 * Sends a decision email to the candidate (approved/rejected).
 * @param {string} to - Candidate's email address
 * @param {'approved' | 'rejected'} decision - The decision status
 * @param {string} [comments] - Optional comments from the recruiter
 * @param {string} [candidateName] - Candidate's name
 */
const sendDecisionEmail = async (to, decision, comments, candidateName) => {
  const subject = `An Update on Your Interview with HireGenius`;
  const decisionText = decision === 'approved' ? 'has been successful' : 'will not be moving forward at this time';
  const commentsSection = comments ? `
    <p style="padding: 15px; background-color: #252525; border-radius: 6px; border: 1px solid #333;">
        <strong>Feedback from the team:</strong><br/>
        <em style="color: #dddddd;">"${comments}"</em>
    </p>
  ` : '';

  const htmlBody = `
    <h2 style="color: #FFFFFF;">Dear ${candidateName || 'Candidate'},</h2>
    <p>Thank you for taking the time to interview with us. We appreciate your interest in the position.</p>
    <p>We have reviewed your assessment and wanted to inform you that your application ${decisionText}.</p>
    ${commentsSection}
    <p style="margin-top: 30px;">We wish you the best in your professional endeavors.</p>
  `;

  const mailOptions = {
      to,
      subject,
      html: `
        <div style="${mainContainerStyle}">
          <div style="${contentWrapperStyle}">
            <div style="${headerStyle}"><h1 style="${headerTextStyle}">Interview Status Update</h1></div>
            <div style="${bodyStyle}">
              ${htmlBody}
            </div>
            <div style="${footerStyle}">© ${new Date().getFullYear()} HireGenius. All Rights Reserved.</div>
          </div>
        </div>
      `
  };
  await sendMail(mailOptions);
};

/**
 * Sends a password reset email with a 6-digit OTP code.
 * @param {string} to - User's email address
 * @param {string} resetCode - 6-digit OTP code
 * @param {string} userName - User's first name
 */
const sendPasswordResetEmail = async (to, resetCode, userName) => {
  const mailOptions = {
    to,
    subject: 'Password Reset Code - HireGenius',
    html: `
      <div style="${mainContainerStyle}">
        <div style="${contentWrapperStyle}">
          <div style="${headerStyle}"><h1 style="${headerTextStyle}">Password Reset</h1></div>
          <div style="${bodyStyle}">
            <h2 style="color: #FFFFFF;">Hello ${userName},</h2>
            <p>We received a request to reset your password. Use the code below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; padding: 16px 40px; background-color: ${mailStyles.accentColor}; color: ${mailStyles.buttonTextColor}; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">${resetCode}</span>
            </div>
            <p style="color: #bdbdbd;">This code is valid for <strong style="color: #FFE066;">30 minutes</strong>.</p>
            <p style="color: #bdbdbd;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div style="${footerStyle}">© ${new Date().getFullYear()} HireGenius. All Rights Reserved.</div>
        </div>
      </div>
    `
  };
  await sendMail(mailOptions);
};

module.exports = {
  sendInviteEmail,
  sendReportEmail,
  sendDecisionEmail,
  sendPasswordResetEmail,
};