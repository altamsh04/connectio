// Standalone Data Viewer - No React dependencies

// Check if chrome API is available
const isChromeAPIAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
};

// Simple implementation of forceUpdateUserData for standalone use
const forceUpdateUserData = async (username) => {
  try {
    if (!username) {
      return { success: false, error: 'Username is required' };
    }

    // Fetch user profile
    const profileResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Extension'
      }
    });

    if (!profileResponse.ok) {
      throw new Error(`GitHub user not found or API error: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();

    // Fetch user repos
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Extension'
      }
    });

    const reposData = reposResponse.ok ? await reposResponse.json() : [];

    // Save to chrome storage
    const githubData = {
      [username]: {
        profile: profileData,
        repositories: reposData,
        fetchedAt: new Date().toISOString()
      }
    };

    if (isChromeAPIAvailable()) {
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ github: githubData }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }

    return { 
      success: true, 
      message: `GitHub data updated for ${username}` 
    };
  } catch (error) {
    console.error('Error updating GitHub data:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

class DataViewer {
  constructor() {
    this.data = null;
    this.apps = [];
    this.selectedApp = 'all';
    this.init().catch(error => {
      console.error('Error initializing DataViewer:', error);
      this.showError('Failed to initialize: ' + error.message);
    });
  }

  async init() {
    this.showLoading();
    await this.loadData();
    this.render();
  }

  async loadData() {
    try {
      const appsUrl = chrome.runtime.getURL('data/apps.json');
      const appsResponse = await fetch(appsUrl);
      
      if (!appsResponse.ok) {
        throw new Error(`Failed to fetch apps: ${appsResponse.status}`);
      }
      
      const appsData = await appsResponse.json();

      // Sort apps: Available first, Coming Soon later
      this.apps = appsData.apps.sort((a, b) => {
        return (a.comingSoon === b.comingSoon) ? 0 : a.comingSoon ? 1 : -1;
      });

      let allStorageData = {};
      
      if (isChromeAPIAvailable()) {
        allStorageData = await new Promise((resolve, reject) => {
          try {
            chrome.storage.local.get(null, (result) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(result);
              }
            });
          } catch (error) {
            reject(error);
          }
        });
      } else {
        console.warn('Chrome API not available, using empty storage data');
      }

      this.data = {};
      this.apps.forEach(app => {
        const appData = allStorageData[app.id] || {};
        this.data[app.id] = {
          app: app,
          data: appData
        };
      });

    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load data: ' + error.message);
      throw error;
    }
  }

  showLoading() {
    const container = document.getElementById('data-container');
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading data...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('data-container');
    if (container) {
      container.innerHTML = `
        <div class="no-data">
          <h3>Error</h3>
          <p>${message}</p>
          <button onclick="dataViewer.init()" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 10px;
          ">Try Again</button>
        </div>
      `;
    }
  }

  renderAppCard(appId, appInfo) {
    const app = appInfo.app;
    const appData = appInfo.data;

    return `
      <div class="user-card" data-app-id="${appId}">
        <button 
          class="toggle-json-btn"
          data-target-id="json-container-${appId}"
          aria-label="Toggle JSON"
        >
          ⬇
        </button>

        <div class="user-header">
          <img 
            src="${app.logo}" 
            alt="${app.name} logo" 
            class="user-avatar"
            onerror="this.style.display='none'"
          />
          <div class="user-info">
            <h3>${app.name}</h3>
            <p>${app.description}</p>
            <p class="status-text" style="color: ${app.comingSoon ? '#ff6b6b' : '#28a745'}">
              ${app.comingSoon ? '🚧 Coming Soon' : '✅ Available'}
            </p>
          </div>
        </div>

        <div id="json-container-${appId}" class="json-viewer hidden">
          <h4>Raw JSON Data</h4>
          <pre>${JSON.stringify(appData, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  bindJsonToggleEvents() {
    const buttons = document.querySelectorAll('.toggle-json-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target-id');
        const container = document.getElementById(targetId);
        if (container) {
          container.classList.toggle('hidden');
          const isHidden = container.classList.contains('hidden');
          button.textContent = isHidden ? '⬇' : '⬆';
        }
      });
    });
  }

  async handleUpdateAppData(appId) {
    if (confirm(`Are you sure you want to refresh data for ${this.apps.find(app => app.id === appId)?.name || appId}?`)) {
      try {
        if (appId === 'github') {
          const githubData = this.data.github?.data || {};
          const usernames = Object.keys(githubData);
          if (usernames.length === 0) {
            alert('No GitHub user data found to update. Please connect to GitHub first.');
            return;
          }

          const username = usernames[0];
          const result = await forceUpdateUserData(username);

          if (result.success) {
            await this.loadData();
            this.render();
            alert(result.message);
          } else {
            alert('Error updating data: ' + result.error);
          }
        } else {
          alert('Update functionality not yet implemented for this app.');
        }
      } catch (err) {
        console.error('Error updating app data:', err);
        alert('Error updating data: ' + err.message);
      }
    }
  }

  async handleClearAllData() {
    if (confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
      try {
        const appIds = this.apps.map(app => app.id);
        if (isChromeAPIAvailable()) {
          await new Promise((resolve, reject) => {
            chrome.storage.local.remove(appIds, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          });
        } else {
          console.warn('Chrome API not available, cannot clear data.');
        }
        await this.loadData();
        this.render();
        alert('All app data cleared successfully!');
      } catch (err) {
        console.error('Error clearing data:', err);
        alert('Error clearing data: ' + err.message);
      }
    }
  }

  render() {
    const container = document.getElementById('data-container');
    if (!this.data || Object.keys(this.data).length === 0 || !container) {
      if (container) {
        container.innerHTML = `
          <div class="no-data">
            <h3>No Apps Found</h3>
            <p>No app data has been loaded yet.</p>
          </div>
        `;
      }
      return;
    }

    const filteredData = this.selectedApp === 'all' 
      ? this.data 
      : { [this.selectedApp]: this.data[this.selectedApp] };

    container.innerHTML = `
      <style>
        .hidden {
          display: none;
        }

        .user-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.04);
        }

        .toggle-json-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          transition: transform 0.2s ease;
          color: #007bff;
        }

        .toggle-json-btn:hover {
          transform: scale(1.1);
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          object-fit: contain;
          border: 1px solid #ccc;
        }

        .user-info h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .user-info p {
          margin: 4px 0;
          font-size: 0.9rem;
          color: #555;
        }

        .status-text {
          font-size: 0.8rem;
        }

        .json-viewer {
          margin-top: 15px;
          padding: 10px;
          background: #f1f3f5;
          border-radius: 6px;
          font-size: 0.85rem;
          overflow-x: auto;
        }
      </style>

      <div style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      ">
        <div>
          <h3 style="margin: 0; color: #333;">
            ${this.selectedApp === 'all' ? 'All Apps' : this.apps.find(app => app.id === this.selectedApp)?.name || this.selectedApp}
          </h3>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">
            Showing data from Chrome storage for ${Object.keys(filteredData).length} app${Object.keys(filteredData).length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      ${Object.entries(filteredData).map(([appId, appInfo]) => 
        this.renderAppCard(appId, appInfo)
      ).join('')}
    `;

    this.bindJsonToggleEvents();
  }
}

// Initialize the data viewer when the page loads
let dataViewer;
document.addEventListener('DOMContentLoaded', () => {
  // Add global error handlers
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  dataViewer = new DataViewer();
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataViewer;
}
