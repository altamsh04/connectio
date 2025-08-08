// handlers/mainHandler.js
import { fetchZomatoOrders } from '../ZomatoOrders';
import { fetchSwiggyOrders } from '../SwiggyOrders';
import { fetchGithubProfiles } from '../GithubProfiles';

// Check if chrome API is available
const isChromeAPIAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
};

// Function to save connected apps to chrome storage
export const saveConnectedApps = (connectedApps) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isChromeAPIAvailable()) {
        reject(new Error('Chrome API not available'));
        return;
      }
      
      const appsArray = Array.from(connectedApps);
      chrome.storage.local.set({ connectedApps: appsArray }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving connected apps:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Connected apps saved:', appsArray);
          resolve(appsArray);
        }
      });
    } catch (error) {
      console.error('Error in saveConnectedApps:', error);
      reject(error);
    }
  });
};

// Function to load connected apps from chrome storage
export const loadConnectedApps = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!isChromeAPIAvailable()) {
        reject(new Error('Chrome API not available'));
        return;
      }
      
      chrome.storage.local.get(['connectedApps'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading connected apps:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const savedApps = result.connectedApps ? new Set(result.connectedApps) : new Set();
          resolve(savedApps);
        }
      });
    } catch (error) {
      console.error('Error in loadConnectedApps:', error);
      reject(error);
    }
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
    saveConnectedApps(updatedSet).catch(error => {
      console.error('Error saving connected apps:', error);
    });
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
        let resolved = false;
        
        fetchZomatoOrders((loading) => {
          if (!loading && !resolved) { // loading finished
            resolved = true;
            resolve();
          }
        });
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Zomato fetch timed out'));
          }
        }, 10000); // 10 second timeout
      });
      
      toggleAppInSet();
      setLoadingMessage && setLoadingMessage('');
      return;
    }

    if (appId === 'swiggy') {
      setLoadingMessage && setLoadingMessage('Fetching Swiggy orders...');
      
      await new Promise((resolve, reject) => {
        let resolved = false;
        
        fetchSwiggyOrders((loading) => {
          if (!loading && !resolved) { // loading finished
            resolved = true;
            resolve();
          }
        });
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Swiggy fetch timed out'));
          }
        }, 15000); // 15 second timeout (longer for Swiggy due to pagination)
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