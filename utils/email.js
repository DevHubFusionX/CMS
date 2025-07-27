const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
  console.log('📧 Email service called with:', {
    to: options.email,
    subject: options.subject,
    hasHtml: !!options.html
  });
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };
  
  console.log('📧 Using Gmail SMTP:', process.env.EMAIL_HOST);
  console.log('📧 Sending email...');
  
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully:', info.messageId);

  return info;
};