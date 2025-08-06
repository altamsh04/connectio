# Data Viewer - Standalone Version

This directory contains the standalone data viewer that can fetch scraped data and display apps from `data/apps.json` without React dependencies.

## Files

### `standalone.js`
A vanilla JavaScript class that provides all the data viewer functionality:
- Loads apps from `data/apps.json`
- Fetches data from Chrome storage
- Renders app cards with data
- Provides filtering and data management

### `export.js`
Export functions for use in other parts of the extension:
- `getAllAppData()` - Get all app data from storage
- `getAppData(appId)` - Get data for a specific app
- `clearAppData(appId)` - Clear data for a specific app
- `clearAllAppData()` - Clear all app data
- `getAppsList()` - Get list of all apps
- `hasAppData(appId)` - Check if an app has data
- `getDataSummary()` - Get summary of all data

### `index.jsx`
React component version of the data viewer (for the main extension)

## Usage

### 1. Standalone HTML Page
The standalone version creates `data-viewer-standalone.html` which can be opened directly in a browser tab.

### 2. Programmatic Usage
```javascript
// Import the functions
import { getAllAppData, getDataSummary } from './DataViewer/export.js';

// Get all app data
const allData = await getAllAppData();

// Get data summary
const summary = await getDataSummary();
console.log(`Found ${summary.appsWithData} apps with data out of ${summary.totalApps} total apps`);
```

### 3. Direct Class Usage
```javascript
// The DataViewer class is available globally when the standalone script loads
const viewer = new DataViewer();
```

## Features

✅ **No React Dependencies** - Pure vanilla JavaScript  
✅ **Chrome Storage Integration** - Fetches data from extension storage  
✅ **App Filtering** - Filter by specific app or view all  
✅ **Data Management** - Clear individual or all app data  
✅ **Raw JSON Display** - Shows complete JSON data for each app  
✅ **Responsive Design** - Works on different screen sizes  
✅ **Error Handling** - Graceful error handling and user feedback  

## Data Structure

The data viewer expects data to be stored in Chrome storage with the following structure:

```javascript
{
  "github": {
    "username1": { /* GitHub user data */ },
    "username2": { /* GitHub user data */ }
  },
  "spotify": {
    "playlists": [ /* Spotify data */ ],
    "recent_tracks": [ /* Spotify data */ ]
  },
  "twitter": {
    "tweets": [ /* Twitter data */ ],
    "profile": { /* Twitter data */ }
  }
  // ... other apps
}
```

## Building

The standalone version is built automatically with the main extension:

```bash
npm run build:chrome
```

This creates:
- `dataViewerStandalone.bundle.js` - The bundled JavaScript
- `data-viewer-standalone.html` - The standalone HTML page

## Accessing the Standalone Viewer

1. **From Extension**: Click "View Data" button in the popup
2. **Direct URL**: `chrome-extension://[extension-id]/data-viewer-standalone.html`
3. **Programmatic**: Open via `chrome.tabs.create({ url: 'data-viewer-standalone.html' })`

## Browser Compatibility

- Chrome Extensions (Manifest V3)
- Firefox Extensions (WebExtensions)
- Any modern browser with Chrome Extensions API support 