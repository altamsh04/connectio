export const handleToggleApp = async (appId, connectedApps, setConnectedApps) => {
  if (appId === 'github') {
    await handleGitHubConnection(connectedApps, setConnectedApps);
    return;
  }

  const newConnectedApps = new Set(connectedApps);
  
  if (newConnectedApps.has(appId)) {
    newConnectedApps.delete(appId);
  } else {
    newConnectedApps.add(appId);
  }
  
  setConnectedApps(newConnectedApps);
  
  try {
    localStorage.setItem('connectedApps', JSON.stringify(Array.from(newConnectedApps)));
  } catch (error) {
    console.error('Error saving connected apps:', error);
  }
};

export const handleGitHubConnection = async (connectedApps, setConnectedApps) => {
  try {
    const username = prompt('Enter your GitHub username:');
    if (!username) return;
    
    const newConnectedApps = new Set(connectedApps);
    newConnectedApps.add('github');
    setConnectedApps(newConnectedApps);
    
    localStorage.setItem('connectedApps', JSON.stringify(Array.from(newConnectedApps)));
    
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'github-loading';
    loadingMessage.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                  z-index: 10000; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <div style="margin-bottom: 10px;">🔄 Scraping GitHub profile...</div>
          <div style="font-size: 12px; color: #666;">This may take a few seconds</div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingMessage);
    
    // Send message to background script to start scraping
    const response = await chrome.runtime.sendMessage({
      action: 'scrapeGitHubProfile',
      username: username
    });
    
    // Remove loading message
    const loadingElement = document.getElementById('github-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    if (response.success) {
      console.log('GitHub data scraped successfully:', response.data);
      alert(`✅ GitHub profile data scraped successfully!\n\nProfile: ${response.data.profile.name}\nRepositories: ${response.data.repositories.length}\n\nData saved to Chrome storage.`);
    } else {
      console.error('GitHub scraping failed:', response.error);
      alert(`❌ Error scraping GitHub profile: ${response.error}`);
    }
    
  } catch (error) {
    console.error('GitHub connection error:', error);
    
    // Remove loading message if it exists
    const loadingElement = document.getElementById('github-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    alert(`❌ Error connecting to GitHub: ${error.message}`);
  }
};

export const loadConnectedApps = () => {
  try {
    const saved = localStorage.getItem('connectedApps');
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (error) {
    console.error('Error loading connected apps:', error);
  }
  return new Set();
};

export const isAppConnected = (appId, connectedApps) => {
  return connectedApps.has(appId);
};

export const getStoredGitHubData = async (username) => {
  try {
    const result = await chrome.storage.local.get(`github_${username}`);
    return result[`github_${username}`] || null;
  } catch (error) {
    console.error('Error retrieving GitHub data:', error);
    return null;
  }
};

export const getAllStoredGitHubData = async () => {
  try {
    const allData = await chrome.storage.local.get(null);
    const githubData = {};
    
    Object.keys(allData).forEach(key => {
      if (key.startsWith('github_')) {
        const username = key.replace('github_', '');
        githubData[username] = allData[key];
      }
    });
    
    return githubData;
  } catch (error) {
    console.error('Error retrieving all GitHub data:', error);
    return {};
  }
};

// Test function to check if background script is working
export const testBackgroundScript = async () => {
  try {
    console.log('Testing background script connection...');
    const response = await chrome.runtime.sendMessage({
      action: 'ping'
    });
    console.log('Background script response:', response);
    return response;
  } catch (error) {
    console.error('Background script test failed:', error);
    return { success: false, error: error.message };
  }
}; 