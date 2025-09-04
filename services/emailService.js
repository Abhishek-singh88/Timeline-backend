const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({  // ← Fixed this line
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};
// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

const sendWelcomeEmail = async (email) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"GitHub Timeline" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to GitHub Timeline Updates!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            
            <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to GitHub Timeline!</h1>
            </div>
            
            <div style="padding: 20px; background: #f6f8fa; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #24292e; margin-top: 0;">What's Next?</h2>
              <ul style="color: #586069; line-height: 1.6;">
                <li>🔄 You'll receive curated GitHub timeline updates</li>
                <li>👥 Discover trending repositories and developer activities</li>
                <li>📊 Stay updated with the latest open source trends</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding: 20px;">
              <p style="color: #24292e; font-size: 16px; margin-bottom: 10px;">
                Updates are sent manually, so you'll only receive them when there's something interesting happening!
              </p>
            </div>
            
            <div style="border-top: 1px solid #e1e4e8; padding-top: 20px; text-align: center;">
              <p style="color: #586069; font-size: 14px; margin: 0;">
                Thanks for subscribing! 
              </p>
            </div>
            
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Welcome email sent to: ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw error;
  }
};

const sendTimelineUpdate = async (email, content) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"GitHub Timeline" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📊 Your GitHub Timeline Update',
      html: content
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Timeline update sent to: ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send timeline update to ${email}:`, error.message);
    throw error;
  }
};

// Send bulk emails with rate limiting
const sendBulkEmails = async (emails, content) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < emails.length; i++) {
    try {
      await sendTimelineUpdate(emails[i], content);
      results.sent++;
      
      // Add delay between emails to avoid rate limiting
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: emails[i],
        error: error.message
      });
    }
  }

  return results;
};

// Test connection on startup
testEmailConnection();

module.exports = {
  sendWelcomeEmail,
  sendTimelineUpdate,
  sendBulkEmails,
  testEmailConnection
};
