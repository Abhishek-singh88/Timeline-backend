
require('dotenv').config();
const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_USER;
const FROM_NAME = 'GitHub Timeline';

if (!API_KEY) {
  console.warn("⚠️ BREVO_API_KEY is not set — emails won't work.");
}

const testEmailConnection = async () => {
  if (!API_KEY) {
    console.error('❌ BREVO_API_KEY missing');
    return false;
  }
  
  try {
    
    const testTo = process.env.TEST_RECIPIENT || FROM_EMAIL;
    const response = await axios.post(BREVO_API_URL, {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: testTo }],
      subject: "Brevo API Connection Test",
      htmlContent: `<p>✅ Brevo API connection verified successfully! ${new Date().toISOString()}</p>`
    }, {
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json'
      }
    });
    
    console.log('✅ Email server connection verified');
    console.log(`✅ Test email sent, messageId: ${response.data.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.response?.data || error.message);
    return false;
  }
};

const sendWelcomeEmail = async (email) => {
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
          <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Welcome to GitHub Timeline!</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 16px;">Your gateway to curated developer insights</p>
        </div>
        
        <!-- Welcome Message -->
        <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1a202c; margin: 0 0 15px 0; font-size: 20px;">🎉 You're officially subscribed!</h2>
          <p style="color: #4a5568; margin: 0 0 20px 0; line-height: 1.5;">
            Thanks for joining! You'll receive curated GitHub timeline updates featuring trending repositories, latest commits, and developer insights.
          </p>
          
          <!-- What You'll Get -->
          <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2d3748; margin: 0 0 12px 0; font-size: 16px;">What to expect:</h3>
            <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
              ✅ Trending repositories and breakthrough projects<br>
              ✅ Latest commits and releases from popular repos<br>
              ✅ Curated content sent only when there's something worth sharing
            </div>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🎯 What's next?</h3>
          <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0 0 10px 0;"><strong>1. Confirmation Complete</strong> - Your subscription is active!</p>
            <p style="margin: 0 0 10px 0;"><strong>2. Smart Delivery</strong> - Updates sent manually when there's existing activity</p>
            <p style="margin: 0;"><strong>3. Stay Informed</strong> - Be the first to discover emerging trends</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #718096; font-size: 14px;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d3748;">GitHub Timeline Updates</p>
          <p style="margin: 0; font-size: 12px;">
            🔒 Privacy first • 📵 Zero spam • Built for developers
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0;">
            This email was sent to ${email} because you subscribed to GitHub Timeline Updates.
          </div>
        </div>
        
      </body>
    </html>
    `;

    const response = await axios.post(BREVO_API_URL, {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: email }],
      subject: '🚀 Welcome to GitHub Timeline Updates!',
      htmlContent
    }, {
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json'
      }
    });

    console.log(`✅ Welcome email sent to: ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.response?.data || error.message);
    throw error;
  }
};

const sendTimelineUpdate = async (email, content) => {
  try {
    const response = await axios.post(BREVO_API_URL, {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: email }],
      subject: 'Your GitHub Timeline Update',
      htmlContent: content
    }, {
      headers: {
        'accept': 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json'
      }
    });

    console.log(`✅ Timeline update sent to: ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send timeline update to ${email}:`, error.response?.data || error.message);
    throw error;
  }
};

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
      
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: emails[i],
        error: error.response?.data || error.message
      });
    }
  }

  return results;
};


testEmailConnection();

module.exports = {
  sendWelcomeEmail,
  sendTimelineUpdate,
  sendBulkEmails,
  testEmailConnection
};