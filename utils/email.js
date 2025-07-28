const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
  console.log('📧 Email service called with:', {
    to: options.to || options.email,
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
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const stripHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  const mailOptions = {
    from: `"FusionX CMS" <${process.env.EMAIL_USER}>`,
    to: options.to || options.email,
    subject: options.subject,
    text: options.text || stripHtml(options.html || options.message || ''),
    html: options.html || options.message,
    headers: {
      'X-Mailer': 'FusionX CMS',
      'X-Priority': '3',
      'List-Unsubscribe': '<mailto:unsubscribe@fusionxcms.com>'
    }
  };
  
  console.log('📧 Using Gmail SMTP:', process.env.EMAIL_HOST);
  console.log('📧 Sending email...');
  
  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent successfully:', info.messageId);

  return info;
};