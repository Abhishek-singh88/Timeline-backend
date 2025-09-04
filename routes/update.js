const express = require('express');
const { fetchGitHubTimeline, generateEmailContent } = require('../services/githubService');
const { sendBulkEmails } = require('../services/emailService');
const supabase = require('../config/supabase');

const router = express.Router();

router.post('/trigger', async (req, res) => {
  try {
    console.log('🚀 Manual update trigger initiated...');

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

    const events = await fetchGitHubTimeline();
    
    if (events.length === 0) {
      return res.json({
        success: false,
        message: 'No GitHub events found to send'
      });
    }

    const emailContent = generateEmailContent(events);
    
    const emailAddresses = subscribers.map(sub => sub.email);

    console.log('Sending emails to subscribers...');
    const results = await sendBulkEmails(emailAddresses, emailContent);

    console.log(`Bulk email completed: ${results.sent} sent, ${results.failed} failed`);
    
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
  console.error('GitHub API Error:', {
    status: error.response?.status,
    message: error.message,
    rateLimitRemaining: error.response?.headers['x-ratelimit-remaining'],
    rateLimitReset: error.response?.headers['x-ratelimit-reset']
  });
  
  if (error.response?.status === 403 || error.response?.status === 429) {
    throw new Error('GitHub API rate limit exceeded. Please try again later or add a GitHub token.');
  }
  
  throw new Error(`GitHub API error: ${error.message}`);
}

});

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
    console.error(' Error fetching timeline preview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch GitHub timeline preview' 
    });
  }
});

module.exports = router;
