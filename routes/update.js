const express = require('express');
const { fetchGitHubTimeline, generateEmailContent } = require('../services/githubService');
const { sendBulkEmails } = require('../services/emailService');
const supabase = require('../config/supabase');

const router = express.Router();

// Manual trigger for sending updates
router.post('/trigger', async (req, res) => {
  try {
    console.log('🚀 Manual update trigger initiated...');

    // Fetch active subscribers
    const { data: subscribers, error } = await supabase
      .from('email_subscribers')
      .select('email')
      .eq('is_active', true);

    if (error) throw error;

    if (subscribers.length === 0) {
      return res.json({ 
        success: true,
        message: 'No active subscribers found',
        subscribers_count: 0
      });
    }

    console.log(`👥 Found ${subscribers.length} active subscribers`);

    // Fetch GitHub timeline
    const events = await fetchGitHubTimeline();
    
    if (events.length === 0) {
      return res.json({
        success: false,
        message: 'No GitHub events found to send'
      });
    }

    // Generate email content
    const emailContent = generateEmailContent(events);
    
    // Extract email addresses
    const emailAddresses = subscribers.map(sub => sub.email);

    // Send bulk emails
    console.log('📧 Sending emails to subscribers...');
    const results = await sendBulkEmails(emailAddresses, emailContent);

    console.log(`✅ Bulk email completed: ${results.sent} sent, ${results.failed} failed`);
    
    res.json({ 
      success: true,
      message: 'GitHub timeline updates sent successfully!',
      data: {
        total_subscribers: subscribers.length,
        emails_sent: results.sent,
        emails_failed: results.failed,
        events_count: events.length,
        errors: results.errors.length > 0 ? results.errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Manual update trigger error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send updates',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get latest GitHub timeline (for preview/testing)
router.get('/preview', async (req, res) => {
  try {
    const events = await fetchGitHubTimeline();
    const emailContent = generateEmailContent(events);
    
    res.json({ 
      success: true,
      events_count: events.length,
      events: events.slice(0, 10),
      email_preview: emailContent
    });
  } catch (error) {
    console.error('❌ Error fetching timeline preview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch GitHub timeline preview' 
    });
  }
});

module.exports = router;
