// Standalone Data Viewer - No React dependencies
class DataViewer {
  constructor() {
    this.data = null;
    this.apps = [];
    this.selectedApp = 'all';
    this.init();
  }

  async init() {
    this.showLoading();
    await this.loadData();
    this.render();
  }

  async loadData() {
    try {
      // Load apps data
      const appsUrl = chrome.runtime.getURL('data/apps.json');
      const appsResponse = await fetch(appsUrl);
      const appsData = await appsResponse.json();
      this.apps = appsData.apps;
      
      // Load all data from Chrome storage
      const allStorageData = await chrome.storage.local.get(null);
      
      // Organize data by app
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

  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  }

  renderAppCard(appId, appInfo) {
    const app = appInfo.app;
    const appData = appInfo.data;
    const hasData = Object.keys(appData).length > 0;

    // Special handling for GitHub to show user info
    let userInfo = '';
    if (appId === 'github' && hasData) {
      const usernames = Object.keys(appData);
      if (usernames.length > 0) {
        const username = usernames[0];
        const userData = appData[username];
        userInfo = `
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #e9ecef;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Current User: @${username}</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <strong>Name:</strong> ${userData.profile?.fullName || 'N/A'}
              </div>
              <div>
                <strong>Bio:</strong> ${userData.profile?.bio || 'N/A'}
              </div>
              <div>
                <strong>Location:</strong> ${userData.profile?.location || 'N/A'}
              </div>
              <div>
                <strong>Company:</strong> ${userData.profile?.company || 'N/A'}
              </div>
              <div>
                <strong>Followers:</strong> ${userData.stats?.followers || 'N/A'}
              </div>
              <div>
                <strong>Following:</strong> ${userData.stats?.following || 'N/A'}
              </div>
              <div>
                <strong>Repositories:</strong> ${userData.stats?.repositories || 'N/A'}
              </div>
              <div>
                <strong>Scraped:</strong> ${this.formatDate(userData.scrapedAt)}
              </div>
            </div>
          </div>
        `;
      }
    }

    return `
      <div class="user-card">
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
            <p style="font-size: 0.8rem; color: ${app.comingSoon ? '#ff6b6b' : '#28a745'}">
              ${app.comingSoon ? '🚧 Coming Soon' : '✅ Available'}
            </p>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-value">${hasData ? 'Yes' : 'No'}</span>
            <span class="stat-label">Has Data</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${Object.keys(appData).length}</span>
            <span class="stat-label">Data Keys</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${app.comingSoon ? 'N/A' : 'Active'}</span>
            <span class="stat-label">Status</span>
          </div>
        </div>

        ${userInfo}

        ${hasData ? `
          <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;">
            <button 
              onclick="dataViewer.handleUpdateAppData('${appId}')"
              style="
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#218838'"
              onmouseout="this.style.background='#28a745'"
            >
              🔄 Update Data
            </button>
          </div>
        ` : ''}

        <div class="json-viewer">
          <h4>Raw JSON Data for ${app.name}</h4>
          <pre>${JSON.stringify(appData, null, 2)}</pre>
        </div>
      </div>
    `;
  }

  async handleUpdateAppData(appId) {
    if (confirm(`Are you sure you want to refresh data for ${this.apps.find(app => app.id === appId)?.name || appId}?`)) {
      try {
        // For now, only GitHub has update functionality
        if (appId === 'github') {
          alert('Update functionality not yet implemented in standalone version.');
        } else {
          alert('Update functionality not yet implemented for this app.');
        }
      } catch (err) {
        alert('Error updating data: ' + err.message);
      }
    }
  }

  async handleClearAllData() {
    if (confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
      try {
        // Clear all app data from storage
        const appIds = this.apps.map(app => app.id);
        await chrome.storage.local.remove(appIds);
        
        // Reload data to reflect changes
        await this.loadData();
        this.render();
        alert('All app data cleared successfully!');
      } catch (err) {
        alert('Error clearing data: ' + err.message);
      }
    }
  }

  render() {
    if (!this.data || Object.keys(this.data).length === 0) {
      const container = document.getElementById('data-container');
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

    // Filter apps based on selection
    const filteredData = this.selectedApp === 'all' 
      ? this.data 
      : { [this.selectedApp]: this.data[this.selectedApp] };

    const container = document.getElementById('data-container');
    if (container) {
      container.innerHTML = `
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
          <div style="display: flex; gap: 10px; align-items: center;">
            <select 
              onchange="dataViewer.selectedApp = this.value; dataViewer.render();"
              style="
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #ddd;
                font-size: 0.9rem;
                background: white;
              "
            >
              <option value="all" ${this.selectedApp === 'all' ? 'selected' : ''}>All Apps</option>
              ${this.apps.map(app => `
                <option value="${app.id}" ${this.selectedApp === app.id ? 'selected' : ''}>
                  ${app.name} ${app.comingSoon ? '(Coming Soon)' : ''}
                </option>
              `).join('')}
            </select>
            <button 
              onclick="dataViewer.handleClearAllData()"
              style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#c82333'"
              onmouseout="this.style.background='#dc3545'"
            >
              Clear All Data
            </button>
          </div>
        </div>
        
        ${Object.entries(filteredData).map(([appId, appInfo]) => 
          this.renderAppCard(appId, appInfo)
        ).join('')}
      `;
    }
  }
}

// Initialize the data viewer when the page loads
let dataViewer;
document.addEventListener('DOMContentLoaded', () => {
  dataViewer = new DataViewer();
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataViewer;
} 