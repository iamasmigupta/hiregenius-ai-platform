const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const ical = require('ical-generator').default;
const config = require('../config');

// Use Resend in production (HTTPS-based, works on Render), Gmail SMTP for local dev
const isProduction = config.nodeEnv === 'production' && config.resendApiKey;
const resend = isProduction ? new Resend(config.resendApiKey) : null;

// Gmail SMTP fallback for local development
const transporter = !isProduction ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.senderEmail,
    pass: config.senderPassword,
  }
}) : null;

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

// Logo path for CID email attachment (local dev only)
const path = require('path');
const logoPath = path.join(__dirname, '..', '..', 'public', 'logo-hiregenius.png');
const emailHeader = (title = 'HireGenius') => `<div style="${headerStyle}"><h1 style="${headerTextStyle}">${title}</h1></div>`;

/**
 * Generic mail sending function — uses Resend in production, Nodemailer locally
 * @param {object} mailOptions - Mail options (to, subject, html, attachments)
 */
const sendMail = async (mailOptions) => {
  try {
    if (isProduction && resend) {
      // Resend API — uses HTTPS, works on all cloud platforms
      const { data, error } = await resend.emails.send({
        from: `HireGenius <${config.resendFromEmail || 'onboarding@resend.dev'}>`,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      if (error) throw new Error(error.message);
      console.log(`Email sent via Resend to ${mailOptions.to}`);
    } else {
      // Gmail SMTP — for local development
      const logoAttachment = {
        filename: 'logo-hiregenius.png',
        path: logoPath,
        cid: 'hiregenius-logo',
      };
      const baseOptions = {
        from: `"HireGenius" <${config.senderEmail}>`,
        attachments: [...(mailOptions.attachments || []), logoAttachment],
      };
      await transporter.sendMail({ ...baseOptions, ...mailOptions, attachments: baseOptions.attachments });
      console.log(`Email sent via Gmail to ${mailOptions.to}`);
    }
  } catch (error) {
    console.error(`Failed to send email to ${mailOptions.to}:`, error);
  }
};

/**
 * Sends an interview invitation email to a candidate with a .ics calendar invite.
 * @param {string} to - Candidate's email address
 * @param {string} link - Unique interview link
 * @param {string} candidateName - Candidate's first name
 * @param {object} [scheduleInfo] - Optional scheduling details
 * @param {Date|string} [scheduleInfo.scheduledAt] - Interview start time
 * @param {number} [scheduleInfo.durationMinutes] - Interview duration in minutes
 * @param {string} [scheduleInfo.templateTitle] - Name of the interview template
 */
const sendInviteEmail = async (to, link, candidateName, scheduleInfo = {}) => {
  const { scheduledAt, durationMinutes = 60, templateTitle = 'AI Interview' } = scheduleInfo;

  const mailOptions = {
    to,
    subject: 'Your AI Interview Invitation',
    html: `
      <div style="${mainContainerStyle}">
        <div style="${contentWrapperStyle}">
          ${emailHeader('HireGenius')}
          <div style="${bodyStyle}">
            <h2 style="color: #FFFFFF;">Hello ${candidateName},</h2>
            <p>You have been invited to participate in an AI-powered interview.</p>
            ${scheduledAt ? `<p style="padding: 12px 16px; background: #252525; border-radius: 6px; border-left: 4px solid #FFE066;"><strong style="color: #FFE066;">📅 Scheduled:</strong> ${new Date(scheduledAt).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}<br/><strong style="color: #FFE066;">⏱ Duration:</strong> ${durationMinutes} minutes<br/><strong style="color: #FFE066;">📋 Template:</strong> ${templateTitle}</p>` : ''}
            <p style="margin: 30px 0;"><a href="${link}" style="${buttonStyle}">Begin Interview</a></p>
            ${scheduledAt ? '<p style="color: #bdbdbd;">📎 A calendar invite (.ics) is attached to this email. Add it to your calendar so you don\'t miss it!</p>' : ''}
            <p>If you encounter any issues, please contact the hiring manager.</p>
            <p>Best of luck!</p>
          </div>
          <div style="${footerStyle}">© ${new Date().getFullYear()} | HireGenius</div>
        </div>
      </div>
    `
  };

  // Generate .ics calendar attachment if schedule info is provided
  if (scheduledAt) {
    const startDate = new Date(scheduledAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const calendar = ical({ name: 'HireGenius Interview' });
    calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: `HireGenius AI Interview - ${templateTitle}`,
      description: `Your AI-powered interview is scheduled.\n\nInterview Link: ${link}\n\nPlease make sure you have a working webcam and microphone.`,
      location: link,
      url: link,
      organizer: { name: 'HireGenius', email: config.senderEmail },
    });

    mailOptions.attachments = [{
      filename: 'interview-invite.ics',
      content: calendar.toString(),
      contentType: 'text/calendar; method=REQUEST',
    }];
  }

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
          ${emailHeader('Report Ready')}
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
            ${emailHeader('Interview Status Update')}
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
          ${emailHeader('Password Reset')}
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

/**
 * Sends a 6-digit verification code email for account creation.
 * @param {string} to - User's email address
 * @param {string} code - 6-digit verification code
 * @param {string} userName - User's first name
 */
const sendVerificationEmail = async (to, code, userName) => {
  const mailOptions = {
    to,
    subject: 'Verify Your HireGenius Account',
    html: `
      <div style="${mainContainerStyle}">
        <div style="${contentWrapperStyle}">
          ${emailHeader('Verify Your Email')}
          <div style="${bodyStyle}">
            <h2 style="color: #FFFFFF;">Welcome ${userName}! 👋</h2>
            <p>Thank you for creating your HireGenius account. Please use the verification code below to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; padding: 16px 40px; background-color: ${mailStyles.accentColor}; color: ${mailStyles.buttonTextColor}; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">${code}</span>
            </div>
            <p style="color: #bdbdbd;">This code is valid for <strong style="color: #FFE066;">10 minutes</strong>.</p>
            <p style="color: #bdbdbd;">If you didn't create an account on HireGenius, please ignore this email.</p>
          </div>
          <div style="${footerStyle}">© ${new Date().getFullYear()} | HireGenius</div>
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
  sendVerificationEmail,
};