const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message
 */
exports.sendEmail = async (options) => {
  // Create a test account if no SMTP settings are provided
  let testAccount;
  if (!process.env.SMTP_HOST) {
    testAccount = await nodemailer.createTestAccount();
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || (testAccount ? testAccount.user : ''),
      pass: process.env.SMTP_PASSWORD || (testAccount ? testAccount.pass : '')
    }
  });

  // Define email options
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@cms.com',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  // If using test account, log URL to view email
  if (testAccount) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};