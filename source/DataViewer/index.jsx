import React, { useState, useEffect } from 'react';
import { getAllStoredGitHubData, clearAllGitHubData, forceUpdateUserData } from '../Popup/handlers/mainHandler';

const DataViewer = () => {
  const [data, setData] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load apps data
      const appsUrl = chrome.runtime.getURL('data/apps.json');
      const appsResponse = await fetch(appsUrl);
      const appsData = await appsResponse.json();
      setApps(appsData.apps);
      
      // Load all data from Chrome storage
      const allStorageData = await chrome.storage.local.get(null);
      
      // Organize data by app
      const organizedData = {};
      
      appsData.apps.forEach(app => {
        const appData = allStorageData[app.id] || {};
        organizedData[app.id] = {
          app: app,
          data: appData
        };
      });
      
      setData(organizedData);
      setError(null);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all app data? This action cannot be undone.')) {
      try {
        // Clear all app data from storage
        const appIds = apps.map(app => app.id);
        await chrome.storage.local.remove(appIds);
        
        // Reload data to reflect changes
        await loadData();
        alert('All app data cleared successfully!');
      } catch (err) {
        alert('Error clearing data: ' + err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const renderAppCard = (appId, appInfo) => {
    const app = appInfo.app;
    const appData = appInfo.data;
    const hasData = Object.keys(appData).length > 0;

    return (
      <div key={appId} className="user-card">
        <div className="user-header">
          <img 
            src={app.logo} 
            alt={`${app.name} logo`} 
            className="user-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="user-info">
            <h3>{app.name}</h3>
            <p>{app.description}</p>
            <p style={{ fontSize: '0.8rem', color: app.comingSoon ? '#ff6b6b' : '#28a745' }}>
              {app.comingSoon ? '🚧 Coming Soon' : '✅ Available'}
            </p>
          </div>
        </div>
        
        {hasData && (
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginTop: '15px',
            justifyContent: 'flex-end'
          }}>
            <button 
              onClick={() => handleUpdateAppData(appId)}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#218838'}
              onMouseOut={(e) => e.target.style.background = '#28a745'}
            >
              🔄 Update Data
            </button>
          </div>
        )}

        <div className="json-viewer">
          <h4>Raw JSON Data for {app.name}</h4>
          <pre>{JSON.stringify(appData, null, 2)}</pre>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-data">
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={loadData}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="no-data">
        <h3>No Apps Found</h3>
        <p>No app data has been loaded yet.</p>
      </div>
    );
  }

  // Filter apps based on selection
  const filteredData = selectedApp === 'all' 
    ? data 
    : { [selectedApp]: data[selectedApp] };

  return (
    <div id="data-container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#333' }}>
            {selectedApp === 'all' ? 'All Apps' : apps.find(app => app.id === selectedApp)?.name || selectedApp}
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Showing data from Chrome storage for {Object.keys(filteredData).length} app{Object.keys(filteredData).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '0.9rem',
              background: 'white'
            }}
          >
            <option value="all">All Apps</option>
            {apps.map(app => (
              <option key={app.id} value={app.id}>
                {app.name} {app.comingSoon ? '(Coming Soon)' : ''}
              </option>
            ))}
          </select>
          <button 
            onClick={handleClearAllData}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#c82333'}
            onMouseOut={(e) => e.target.style.background = '#dc3545'}
          >
            Clear All Data
          </button>
        </div>
      </div>
      
      {Object.entries(filteredData).map(([appId, appInfo]) => 
        renderAppCard(appId, appInfo)
      )}
    </div>
  );
};

export default DataViewer; 