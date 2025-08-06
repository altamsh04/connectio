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
    
    // Check if data already exists for this username
    const existingData = await chrome.storage.local.get('github');
    const githubData = existingData.github || {};
    const existingUserData = githubData[username];
    
    let actionMessage = 'Opening GitHub profile and scraping data...';
    if (existingUserData) {
      const lastScraped = new Date(existingUserData.scrapedAt).toLocaleString();
      const updateConfirmed = confirm(
        `Data for @${username} already exists (last scraped: ${lastScraped}).\n\nDo you want to update with fresh data from GitHub?`
      );
      if (!updateConfirmed) return;
      actionMessage = 'Updating GitHub profile with fresh data...';
    }
    
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
          <div style="margin-bottom: 10px;">🔄 ${actionMessage}</div>
          <div style="font-size: 12px; color: #666;">This may take a few seconds</div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingMessage);
    
    // Open GitHub profile in new tab and scrape
    const profileData = await scrapeGitHubProfile(username);
    
    // Remove loading message
    const loadingElement = document.getElementById('github-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    if (profileData.success) {
      console.log('GitHub data scraped successfully:', profileData.data);
      
      // Store only the current user's data (replace any existing data)
      await chrome.storage.local.set({
        github: {
          [username]: profileData.data
        }
      });
      
      const actionType = existingUserData ? 'updated' : 'scraped';
      alert(`✅ GitHub profile data ${actionType} successfully!\n\nName: ${profileData.data.profile.fullName}\nUsername: ${profileData.data.profile.username}\nRepositories: ${profileData.data.stats?.repositories || 'N/A'}\n\nData ${actionType === 'updated' ? 'updated' : 'saved'} to Chrome storage.`);
    } else {
      console.error('GitHub scraping failed:', profileData.error);
      alert(`❌ Error scraping GitHub profile: ${profileData.error}`);
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

// New function to open tab and scrape GitHub profile
export const scrapeGitHubProfile = async (username) => {
  return new Promise((resolve) => {
    try {
      // Create a new tab with GitHub profile URL
      const githubUrl = `https://github.com/${username}`;
      
      chrome.tabs.create({ 
        url: githubUrl, 
        active: false // Don't switch to the tab immediately
      }, async (tab) => {
        // Wait for tab to load
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            
            // Execute content script to scrape the profile data (Manifest V3)
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (username) => {
                try {
                  // Scrape full name from the vcard structure
                  const fullNameElement = document.querySelector('.vcard-names .p-name.vcard-fullname[itemprop="name"]');
                  const usernameElement = document.querySelector('.vcard-names .p-nickname.vcard-username[itemprop="additionalName"]');
                  const pronounsElement = document.querySelector('.vcard-names [itemprop="pronouns"]');
                  
                  // Alternative selectors in case the structure changes
                  const altFullNameElement = document.querySelector('h1.vcard-names span[itemprop="name"]');
                  const altUsernameElement = document.querySelector('h1.vcard-names span[itemprop="additionalName"]');
                  
                  // Extract full name
                  let fullName = '';
                  if (fullNameElement) {
                    fullName = fullNameElement.textContent.trim();
                  } else if (altFullNameElement) {
                    fullName = altFullNameElement.textContent.trim();
                  }
                  
                  // Extract username (clean format)
                  let cleanUsername = '';
                  if (usernameElement) {
                    const usernameText = usernameElement.textContent.trim();
                    // Remove pronouns and extra characters, just get the username
                    cleanUsername = usernameText.split('·')[0].trim();
                  } else if (altUsernameElement) {
                    const usernameText = altUsernameElement.textContent.trim();
                    cleanUsername = usernameText.split('·')[0].trim();
                  }
                  
                  // Extract pronouns if available
                  let pronouns = '';
                  if (pronounsElement) {
                    pronouns = pronounsElement.textContent.trim();
                  }
                  
                  // Scrape additional profile information
                  const bioElement = document.querySelector('[data-bio-text]');
                  const bio = bioElement ? bioElement.textContent.trim() : '';
                  
                  const locationElement = document.querySelector('[itemprop="homeLocation"]');
                  const location = locationElement ? locationElement.textContent.trim() : '';
                  
                  const companyElement = document.querySelector('[itemprop="worksFor"]');
                  const company = companyElement ? companyElement.textContent.trim() : '';
                  
                  // Scrape repository count
                  const repoCountElement = document.querySelector('nav[data-pjax="#js-pjax-container"] a[href$="?tab=repositories"] .Counter');
                  const repositoryCount = repoCountElement ? parseInt(repoCountElement.textContent.trim()) : 0;
                  
                  // Scrape follower/following counts
                  const followersElement = document.querySelector('a[href$="?tab=followers"] .text-bold');
                  const followingElement = document.querySelector('a[href$="?tab=following"] .text-bold');
                  
                  const followers = followersElement ? followersElement.textContent.trim() : '0';
                  const following = followingElement ? followingElement.textContent.trim() : '0';
                  
                  // Avatar URL
                  const avatarElement = document.querySelector('.avatar-user');
                  const avatarUrl = avatarElement ? avatarElement.src : '';
                  
                  return {
                    success: true,
                    data: {
                      profile: {
                        fullName: fullName,
                        username: cleanUsername || username,
                        pronouns: pronouns,
                        bio: bio,
                        location: location,
                        company: company,
                        avatarUrl: avatarUrl,
                        profileUrl: window.location.href
                      },
                      stats: {
                        repositories: repositoryCount,
                        followers: followers,
                        following: following
                      },
                      scrapedAt: new Date().toISOString()
                    }
                  };
                } catch (error) {
                  return {
                    success: false,
                    error: 'Error parsing GitHub profile: ' + error.message
                  };
                }
              },
              args: [username]
            }).then((results) => {
              // Close the tab after scraping
              chrome.tabs.remove(tab.id);
              
              if (results && results[0] && results[0].result) {
                resolve(results[0].result);
              } else {
                resolve({
                  success: false,
                  error: 'Failed to execute scraping script'
                });
              }
            });
          }
        });
      });
    } catch (error) {
      resolve({
        success: false,
        error: 'Error creating tab: ' + error.message
      });
    }
  });
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
    const result = await chrome.storage.local.get('github');
    const githubData = result.github || {};
    return githubData[username] || null;
  } catch (error) {
    console.error('Error retrieving GitHub data:', error);
    return null;
  }
};

export const getAllStoredGitHubData = async () => {
  try {
    const result = await chrome.storage.local.get('github');
    let githubData = result.github || {};
    
    // Migration: Check for old format data (github_username keys)
    const allData = await chrome.storage.local.get(null);
    const oldFormatData = {};
    let hasOldData = false;
    
    Object.keys(allData).forEach(key => {
      if (key.startsWith('github_') && key !== 'github') {
        const username = key.replace('github_', '');
        oldFormatData[username] = allData[key];
        hasOldData = true;
      }
    });
    
    // If old format data exists, migrate it and remove old keys
    if (hasOldData) {
      console.log('Migrating old format GitHub data...');
      // For single user storage, keep only the most recent data
      const mostRecentKey = Object.keys(oldFormatData).sort((a, b) => {
        const dateA = new Date(oldFormatData[a].scrapedAt || 0);
        const dateB = new Date(oldFormatData[b].scrapedAt || 0);
        return dateB - dateA;
      })[0];
      
      githubData = { [mostRecentKey]: oldFormatData[mostRecentKey] };
      
      // Save migrated data
      await chrome.storage.local.set({ github: githubData });
      
      // Remove old keys
      const keysToRemove = Object.keys(allData).filter(key => key.startsWith('github_'));
      await chrome.storage.local.remove(keysToRemove);
      
      console.log('Migration completed successfully - kept most recent user data');
    }
    
    return githubData;
  } catch (error) {
    console.error('Error retrieving all GitHub data:', error);
    return {};
  }
};

// Function to clear current GitHub data (since we only store one user at a time)
export const clearCurrentGitHubData = async () => {
  try {
    await chrome.storage.local.remove('github');
    return { success: true, message: 'Current GitHub data cleared successfully' };
  } catch (error) {
    console.error('Error clearing GitHub data:', error);
    return { success: false, error: error.message };
  }
};

// Function to clear all GitHub data
export const clearAllGitHubData = async () => {
  try {
    await chrome.storage.local.remove('github');
    return { success: true, message: 'All GitHub data cleared successfully' };
  } catch (error) {
    console.error('Error clearing GitHub data:', error);
    return { success: false, error: error.message };
  }
};

// Function to force update a specific user's data
export const forceUpdateUserData = async (username) => {
  try {
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'github-update-loading';
    loadingMessage.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                  z-index: 10000; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <div style="margin-bottom: 10px;">🔄 Updating data for @${username}...</div>
          <div style="font-size: 12px; color: #666;">This may take a few seconds</div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingMessage);
    
    // Scrape fresh data
    const profileData = await scrapeGitHubProfile(username);
    
    // Remove loading message
    const loadingElement = document.getElementById('github-update-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    if (profileData.success) {
      // Update the data in storage (replace any existing data)
      await chrome.storage.local.set({
        github: {
          [username]: profileData.data
        }
      });
      
      return { 
        success: true, 
        message: `Data for @${username} updated successfully!`,
        data: profileData.data
      };
    } else {
      return { 
        success: false, 
        error: `Failed to update data for @${username}: ${profileData.error}` 
      };
    }
  } catch (error) {
    // Remove loading message if it exists
    const loadingElement = document.getElementById('github-update-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    console.error('Error updating user data:', error);
    return { success: false, error: error.message };
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