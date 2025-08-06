// App.js
import React, { useState, useEffect } from 'react';
import AppsGrid from './components/AppsGrid';
import Header from './components/Header';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { handleToggleApp, loadConnectedApps } from './handlers/buttonHandlers';
import './tailwind.css';

function App() {
  const [apps, setApps] = useState([]);
  const [connectedApps, setConnectedApps] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load apps data
  useEffect(() => {
    loadApps();
    const savedApps = loadConnectedApps();
    setConnectedApps(savedApps);
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      // Use chrome.runtime.getURL to get the correct path for the extension
      const appsUrl = chrome.runtime.getURL('data/apps.json');
      const response = await fetch(appsUrl);
      const data = await response.json();
      
      // Sort apps: available apps first (comingSoon: false), then coming soon apps (comingSoon: true)
      const sortedApps = data.apps.sort((a, b) => {
        if (a.comingSoon === b.comingSoon) return 0;
        return a.comingSoon ? 1 : -1;
      });
      
      setApps(sortedApps);
      setError(null);
    } catch (error) {
      console.error('Error loading apps:', error);
      setError('Failed to load apps. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleAppToggle = async (appId) => {
    await handleToggleApp(appId, connectedApps, setConnectedApps);
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 min-h-screen">
        <Header />
        <main className="bg-white rounded-xl p-6 shadow-lg backdrop-blur-lg">
          <div className="text-center p-4 text-red-600 bg-red-50 rounded-lg mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle size={20} />
              <p className="font-medium">Error</p>
            </div>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadApps}
              className="mt-4 px-4 py-2 bg-primary-500 text-white border-none rounded cursor-pointer hover:bg-primary-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 min-h-screen">
      <Header />
      <main className="bg-white rounded-xl p-6 shadow-lg backdrop-blur-lg">
        {loading ? (
          <div className="text-center p-8 text-gray-600">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary-500" />
            <div>Loading apps...</div>
          </div>
        ) : (
          <AppsGrid 
            apps={apps}
            connectedApps={connectedApps}
            onToggleApp={handleAppToggle}
          />
        )}
      </main>
    </div>
  );
}

export default App;
