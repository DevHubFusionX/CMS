const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
  console.log('📧 Email service called with:', {
    to: options.email,
    subject: options.subject,
    hasHtml: !!options.html
  });
  
  let testAccount;
  let transporter;
  
  try {
    // Always create test account for development
    testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('📧 Using Ethereal test account:', testAccount.user);
  } catch (error) {
    console.log('❌ Failed to create test account:', error.message);
    throw new Error('Email service unavailable');
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
  console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));

  return info;
};