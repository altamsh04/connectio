// Export functions for data viewer functionality
// This can be used in other parts of the extension or external scripts

import { getAllStoredGitHubData, clearAllGitHubData, forceUpdateUserData } from '../Popup/handlers/buttonHandlers';

// Function to get all app data from Chrome storage
export const getAllAppData = async () => {
  try {
    // Load apps data
    const appsUrl = chrome.runtime.getURL('data/apps.json');
    const appsResponse = await fetch(appsUrl);
    const appsData = await appsResponse.json();
    
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
    
    return organizedData;
  } catch (error) {
    console.error('Error retrieving all app data:', error);
    return {};
  }
};

// Function to get data for a specific app
export const getAppData = async (appId) => {
  try {
    const allData = await getAllAppData();
    return allData[appId] || null;
  } catch (error) {
    console.error('Error retrieving app data:', error);
    return null;
  }
};

// Function to clear data for a specific app
export const clearAppData = async (appId) => {
  try {
    await chrome.storage.local.remove(appId);
    return { success: true, message: `Data for ${appId} cleared successfully` };
  } catch (error) {
    console.error('Error clearing app data:', error);
    return { success: false, error: error.message };
  }
};

// Function to clear all app data
export const clearAllAppData = async () => {
  try {
    const appsUrl = chrome.runtime.getURL('data/apps.json');
    const appsResponse = await fetch(appsUrl);
    const appsData = await appsResponse.json();
    
    const appIds = appsData.apps.map(app => app.id);
    await chrome.storage.local.remove(appIds);
    
    return { success: true, message: 'All app data cleared successfully' };
  } catch (error) {
    console.error('Error clearing all app data:', error);
    return { success: false, error: error.message };
  }
};

// Function to get apps list
export const getAppsList = async () => {
  try {
    const appsUrl = chrome.runtime.getURL('data/apps.json');
    const appsResponse = await fetch(appsUrl);
    const appsData = await appsResponse.json();
    return appsData.apps;
  } catch (error) {
    console.error('Error loading apps list:', error);
    return [];
  }
};

// Function to check if an app has data
export const hasAppData = async (appId) => {
  try {
    const result = await chrome.storage.local.get(appId);
    return Object.keys(result[appId] || {}).length > 0;
  } catch (error) {
    console.error('Error checking app data:', error);
    return false;
  }
};

// Function to get data summary
export const getDataSummary = async () => {
  try {
    const allData = await getAllAppData();
    const summary = {
      totalApps: Object.keys(allData).length,
      appsWithData: 0,
      totalDataKeys: 0,
      apps: {}
    };
    
    Object.entries(allData).forEach(([appId, appInfo]) => {
      const dataKeys = Object.keys(appInfo.data).length;
      summary.totalDataKeys += dataKeys;
      
      if (dataKeys > 0) {
        summary.appsWithData++;
      }
      
      summary.apps[appId] = {
        name: appInfo.app.name,
        hasData: dataKeys > 0,
        dataKeys: dataKeys,
        comingSoon: appInfo.app.comingSoon
      };
    });
    
    return summary;
  } catch (error) {
    console.error('Error getting data summary:', error);
    return null;
  }
};

// Export the original GitHub functions for backward compatibility
export { getAllStoredGitHubData, clearAllGitHubData, forceUpdateUserData }; 