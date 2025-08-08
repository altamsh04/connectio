// App.js
import React, { useState, useEffect } from 'react';
import AppsGrid from './components/AppsGrid';
import Header from './components/Header';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { handleToggleApp, loadConnectedApps } from './handlers/mainHandler';
import CustomLoader from './components/SaveLoader';
import './tailwind.css';

function App() {
  const [apps, setApps] = useState([]);
  const [connectedApps, setConnectedApps] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Load apps data and connected apps
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Load apps data
        await loadApps();
        
        // Load connected apps
        const savedApps = await loadConnectedApps();
        setConnectedApps(savedApps);
        
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to initialize app. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeApp().catch(error => {
      console.error('Unhandled error in initializeApp:', error);
      setError('Failed to initialize app. Please try again.');
      setLoading(false);
    });
  }, []);

  const loadApps = async () => {
    try {
      // Use chrome.runtime.getURL to get the correct path for the extension
      const appsUrl = chrome.runtime.getURL('data/apps.json');
      const response = await fetch(appsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch apps: ${response.status}`);
      }
      
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
      throw error; // Re-throw to be caught by the caller
    }
  };

  const handleAppToggle = async (appId) => {
    try {
      await handleToggleApp(appId, connectedApps, setConnectedApps, setLoadingMessage);
    } catch (error) {
      console.error('Error toggling app:', error);
      setLoadingMessage('Error occurred while processing. Please try again.');
      setTimeout(() => setLoadingMessage(''), 3000);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    
    try {
      await loadApps();
      const savedApps = await loadConnectedApps();
      setConnectedApps(savedApps);
    } catch (error) {
      setError('Failed to load apps. Please try again.');
    } finally {
      setLoading(false);
    }
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
              onClick={handleRetry}
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
        {loadingMessage && <CustomLoader message={loadingMessage} />}
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