const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
  console.log('📧 Email service called with:', {
    to: options.email,
    subject: options.subject,
    hasHtml: !!options.html
  });
  
  let transporter;
  let isTestMode = false;
  
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    // Use real SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    console.log('📧 Using real SMTP:', process.env.SMTP_HOST);
  } else {
    // Fallback to test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    isTestMode = true;
    console.log('📧 Using test account:', testAccount.user);
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'FusionX CMS <noreply@fusionxcms.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };
  
  console.log('📧 Sending email...');
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully:', info.messageId);
  
  if (isTestMode) {
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};