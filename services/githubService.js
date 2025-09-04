const axios = require('axios');

const fetchGitHubTimeline = async () => {
  try {
    console.log('🔍 Fetching GitHub timeline...');
    
    const response = await axios.get('https://api.github.com/events', {
      headers: {
        'User-Agent': 'GitHub-Timeline-App',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 10000 // 10 second timeout
    });

    const events = response.data.slice(0, 15); // Get top 15 events
    
    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.type,
      actor: {
        login: event.actor.login,
        avatar_url: event.actor.avatar_url
      },
      repo: {
        name: event.repo.name,
        url: `https://github.com/${event.repo.name}`
      },
      created_at: new Date(event.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      action: getEventDescription(event)
    }));

    console.log(`✅ Fetched ${formattedEvents.length} GitHub events`);
    return formattedEvents;

  } catch (error) {
    console.error('❌ Error fetching GitHub timeline:', error.message);
    if (error.response) {
      console.error('GitHub API Response:', error.response.status, error.response.statusText);
    }
    throw new Error('Failed to fetch GitHub timeline');
  }
};

const getEventDescription = (event) => {
  switch (event.type) {
    case 'PushEvent':
      const commitCount = event.payload.commits?.length || 0;
      return `pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''}`;
    case 'CreateEvent':
      const refType = event.payload.ref_type;
      return `created ${refType}`;
    case 'WatchEvent':
      return 'starred the repository';
    case 'ForkEvent':
      return 'forked the repository';
    case 'IssuesEvent':
      return `${event.payload.action} an issue`;
    case 'PullRequestEvent':
      return `${event.payload.action} a pull request`;
    case 'DeleteEvent':
      return `deleted ${event.payload.ref_type}`;
    case 'PublicEvent':
      return 'made the repository public';
    case 'MemberEvent':
      return `${event.payload.action} a collaborator`;
    case 'ReleaseEvent':
      return `${event.payload.action} a release`;
    default:
      return event.type.replace('Event', '').toLowerCase();
  }
};

const generateEmailContent = (events) => {
  const eventItems = events.map(event => `
    <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #0366d6; background: #f6f8fa; border-radius: 6px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <img src="${event.actor.avatar_url}" alt="${event.actor.login}" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 8px;">
        <strong style="color: #0366d6;">${event.actor.login}</strong>
        <span style="margin: 0 5px; color: #666;">•</span>
        <small style="color: #666;">${event.created_at}</small>
      </div>
      <div style="margin-left: 28px;">
        <span style="color: #24292e;">${event.action} in</span>
        <a href="${event.repo.url}" style="color: #0366d6; text-decoration: none; font-weight: 500;">
          ${event.repo.name}
        </a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GitHub Timeline Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🐙 GitHub Timeline Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Latest activities from the GitHub community</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #24292e; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px;">Recent Activities</h2>
          ${eventItems}
        </div>
        
        <div style="border-top: 1px solid #e1e4e8; padding-top: 20px; text-align: center;">
          <p style="color: #586069; font-size: 14px; margin: 0;">
            🚀 You're receiving this because you subscribed to GitHub Timeline updates
          </p>
          <p style="color: #586069; font-size: 12px; margin: 5px 0 0 0;">
            Generated on ${new Date().toLocaleDateString()}
          </p>
        </div>
        
      </body>
    </html>
  `;
};

module.exports = {
  fetchGitHubTimeline,
  generateEmailContent
};
