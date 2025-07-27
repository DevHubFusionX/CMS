const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message
 */
exports.sendEmail = async (options) => {
  console.log('📧 Email service called with:', {
    to: options.email,
    subject: options.subject,
    hasHtml: !!options.html
  });
  
  // Create a test account if no SMTP settings are provided
  let testAccount;
  if (!process.env.SMTP_HOST) {
    console.log('⚠️ No SMTP_HOST found, creating test account');
    testAccount = await nodemailer.createTestAccount();
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmass.co',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // Use STARTTLS
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER || 'gmass',
      pass: process.env.SMTP_PASSWORD || 'd5adc158-e907-43c0-9ae3-aa1c270265cd'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Define email options
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'FusionX CMS <noreply@fusionxcms.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  console.log('📧 SMTP Config:', {
    host: process.env.SMTP_HOST || 'smtp.gmass.co',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'gmass'
  });
  
  // Send email
  console.log('📧 Sending email...');
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully:', info.messageId);

  // If using test account, log URL to view email
  if (testAccount) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};