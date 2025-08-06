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
    
    let actionMessage = 'Fetching GitHub profile data from API...';
    if (existingUserData) {
      const lastFetched = new Date(existingUserData.fetchedAt).toLocaleString();
      const updateConfirmed = confirm(
        `Data for @${username} already exists (last fetched: ${lastFetched}).\n\nDo you want to update with fresh data from GitHub API?`
      );
      if (!updateConfirmed) return;
      actionMessage = 'Updating GitHub profile with fresh API data...';
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
    
    // Fetch GitHub profile using API
    const profileData = await fetchGitHubProfile(username);
    
    // Remove loading message
    const loadingElement = document.getElementById('github-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    if (profileData.success) {
      console.log('GitHub data fetched successfully:', profileData.data);
      
      // Store only the current user's data (replace any existing data)
      await chrome.storage.local.set({
        github: {
          [username]: profileData.data
        }
      });
      
      const actionType = existingUserData ? 'updated' : 'fetched';
      alert(`✅ GitHub profile data ${actionType} successfully!\n\nName: ${profileData.data.profile.fullName || profileData.data.profile.username}\nUsername: ${profileData.data.profile.username}\nPublic Repositories: ${profileData.data.stats?.publicRepos || 'N/A'}\n\nData ${actionType === 'updated' ? 'updated' : 'saved'} to Chrome storage.`);
    } else {
      console.error('GitHub API fetch failed:', profileData.error);
      alert(`❌ Error fetching GitHub profile: ${profileData.error}`);
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

// Enhanced function to fetch GitHub profile and repositories using API
export const fetchGitHubProfile = async (username) => {
  try {
    // Fetch user profile data
    const profileResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Extension'
      }
    });

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        return {
          success: false,
          error: `User '${username}' not found`
        };
      } else if (profileResponse.status === 403) {
        return {
          success: false,
          error: 'API rate limit exceeded. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: `GitHub API error: ${profileResponse.status}`
        };
      }
    }

    const profileData = await profileResponse.json();

    // Fetch repositories data
    const repositoryData = await fetchUserRepositories(username);

    // Combine the data
    const combinedData = {
      success: true,
      data: {
        profile: {
          fullName: profileData.name,
          username: profileData.login,
          bio: profileData.bio,
          location: profileData.location,
          company: profileData.company,
          avatarUrl: profileData.avatar_url,
          profileUrl: profileData.html_url,
          blog: profileData.blog,
          email: profileData.email,
          twitterUsername: profileData.twitter_username,
          hireable: profileData.hireable,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at
        },
        stats: {
          publicRepos: profileData.public_repos,
          totalPrivateRepos: profileData.total_private_repos,
          followers: profileData.followers,
          following: profileData.following,
          publicGists: profileData.public_gists,
          ownedPrivateRepos: profileData.owned_private_repos
        },
        repositories: repositoryData.repositories || [],
        repositoryStats: {
          total: repositoryData.repositories?.length || 0,
          public: repositoryData.repositories?.filter(repo => !repo.private).length || 0,
          private: repositoryData.repositories?.filter(repo => repo.private).length || 0,
          forks: repositoryData.repositories?.filter(repo => repo.fork).length || 0
        },
        fetchedAt: new Date().toISOString()
      }
    };

    return combinedData;
  } catch (error) {
    return {
      success: false,
      error: 'Error fetching GitHub data: ' + error.message
    };
  }
};

// Function to fetch user repositories using pagination
const fetchUserRepositories = async (username, perPage = 100) => {
  try {
    const repositories = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const repoResponse = await fetch(
        `https://api.github.com/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Profile-Extension'
          }
        }
      );

      if (!repoResponse.ok) {
        console.error(`Error fetching repositories page ${page}:`, repoResponse.status);
        break;
      }

      const repos = await repoResponse.json();
      
      if (repos.length === 0) {
        hasMorePages = false;
      } else {
        // Transform repository data to match our format
        const transformedRepos = repos.map(repo => ({
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          apiUrl: repo.url,
          private: repo.private,
          status: repo.private ? 'private' : 'public',
          description: repo.description,
          language: repo.language,
          defaultBranch: repo.default_branch,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          size: repo.size,
          starCount: repo.stargazers_count,
          watchersCount: repo.watchers_count,
          forkCount: repo.forks_count,
          openIssuesCount: repo.open_issues_count,
          topics: repo.topics || [],
          license: repo.license ? repo.license.name : null,
          fork: repo.fork,
          archived: repo.archived,
          disabled: repo.disabled,
          hasIssues: repo.has_issues,
          hasProjects: repo.has_projects,
          hasWiki: repo.has_wiki,
          hasPages: repo.has_pages,
          hasDownloads: repo.has_downloads,
          visibility: repo.visibility,
          cloneUrl: repo.clone_url,
          sshUrl: repo.ssh_url,
          homepage: repo.homepage
        }));

        repositories.push(...transformedRepos);
        page++;

        // Add a small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { repositories };
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return { 
      repositories: [],
      error: 'Error fetching repositories: ' + error.message 
    };
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
        const dateA = new Date(oldFormatData[a].fetchedAt || oldFormatData[a].scrapedAt || 0);
        const dateB = new Date(oldFormatData[b].fetchedAt || oldFormatData[b].scrapedAt || 0);
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
    
    // Fetch fresh data from API
    const profileData = await fetchGitHubProfile(username);
    
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

// Function to get GitHub API rate limit status
export const getGitHubRateLimit = async () => {
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Extension'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data.rate
      };
    } else {
      return {
        success: false,
        error: 'Failed to fetch rate limit'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to fetch additional user details (like contribution activity)
export const fetchUserContributions = async (username) => {
  try {
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=10`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Extension'
      }
    });

    if (!eventsResponse.ok) {
      return { success: false, error: `Error fetching events: ${eventsResponse.status}` };
    }

    const events = await eventsResponse.json();
    
    return {
      success: true,
      data: events.map(event => ({
        type: event.type,
        repo: event.repo.name,
        createdAt: event.created_at,
        payload: event.payload
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error fetching user contributions: ' + error.message
    };
  }
};

// Test function to check GitHub API connection
export const testGitHubAPI = async () => {
  try {
    console.log('Testing GitHub API connection...');
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Extension'
      }
    });
    
    console.log('GitHub API response status:', response.status);
    return { 
      success: true, 
      status: response.status,
      message: response.status === 401 ? 'API working (authentication required for this endpoint)' : 'API working'
    };
  } catch (error) {
    console.error('GitHub API test failed:', error);
    return { success: false, error: error.message };
  }
};