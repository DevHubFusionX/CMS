const fs = require('fs');
const path = require('path');

const renderEmailVerificationOTP = (userName, otpCode) => {
  const templatePath = path.join(__dirname, '../templates/emailVerificationOTP.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  template = template.replace(/{{userName}}/g, userName);
  template = template.replace(/{{otpCode}}/g, otpCode);
  template = template.replace(/{{currentYear}}/g, new Date().getFullYear());
  
  return template;
};

module.exports = {
  renderEmailVerificationOTP
};