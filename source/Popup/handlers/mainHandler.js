// handlers/mainHandler.js
import { fetchZomatoOrders } from '../ZomatoOrders';
import { fetchGithubProfiles } from '../GithubProfiles';

// Function to save connected apps to chrome storage
export const saveConnectedApps = (connectedApps) => {
  const appsArray = Array.from(connectedApps);
  chrome.storage.local.set({ connectedApps: appsArray }, () => {
    console.log('Connected apps saved:', appsArray);
  });
};

// Function to load connected apps from chrome storage
export const loadConnectedApps = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['connectedApps'], (result) => {
      const savedApps = result.connectedApps ? new Set(result.connectedApps) : new Set();
      resolve(savedApps);
    });
  });
};

export const handleToggleApp = async (appId, connectedApps, setConnectedApps, setLoadingMessage) => {
  const isCurrentlyConnected = connectedApps.has(appId);
  
  const toggleAppInSet = () => {
    const updatedSet = new Set(connectedApps);
    if (isCurrentlyConnected) {
      updatedSet.delete(appId);
      console.log(`Disconnected from ${appId}`);
    } else {
      updatedSet.add(appId);
      console.log(`Connected to ${appId}`);
    }
    setConnectedApps(updatedSet);
    saveConnectedApps(updatedSet);
    return updatedSet;
  };

  // If app is currently connected, just disconnect it
  if (isCurrentlyConnected) {
    toggleAppInSet();
    return;
  }

  // If app is not connected, fetch data and then connect
  try {
    if (appId === 'zomato') {
      setLoadingMessage && setLoadingMessage('Fetching Zomato orders...');
      
      await new Promise((resolve, reject) => {
        fetchZomatoOrders((loading) => {
          if (!loading) { // loading finished
            resolve();
          }
        });
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          resolve();
        }, 10000); // 10 second timeout
      });
      
      toggleAppInSet();
      setLoadingMessage && setLoadingMessage('');
      return;
    }

    if (appId === 'github') {
      setLoadingMessage && setLoadingMessage('Fetching GitHub data...');
      
      await fetchGithubProfiles((loading) => {
        if (!loading) {
          setLoadingMessage && setLoadingMessage('');
        }
      });
      
      toggleAppInSet();
      setLoadingMessage && setLoadingMessage('');
      return;
    }

    // For other apps that don't have fetch functions yet
    toggleAppInSet();
    
  } catch (error) {
    console.error(`Error handling ${appId}:`, error);
    setLoadingMessage && setLoadingMessage('');
    // Still toggle the app even if there was an error
    toggleAppInSet();
  }
};