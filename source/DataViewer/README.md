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
✅ **Data Updates** - Update GitHub data with fresh scraping  
✅ **Enhanced GitHub Scraping** - Comprehensive repository data collection  
✅ **Public Repository Count** - Shows count of public repositories only  
✅ **Repository Details** - Name, status, description, language, license, stars, forks  
✅ **Raw JSON Display** - Shows complete JSON data for each app  
✅ **Responsive Design** - Works on different screen sizes  
✅ **Error Handling** - Graceful error handling and user feedback  
✅ **GitHub Single-Entity Storage** - Only stores the most recent GitHub user's data  

## Data Structure

The data viewer expects data to be stored in Chrome storage with the following structure:

```javascript
{
  "github": {
    "current_username": { 
      "profile": { 
        "fullName": "User Full Name",
        "username": "username",
        "bio": "User bio",
        "location": "User location",
        "company": "User company",
        "avatarUrl": "https://avatars.githubusercontent.com/...",
        "profileUrl": "https://github.com/username"
      },
      "stats": { 
        "repositories": 10,
        "followers": "100",
        "following": "50"
      },
      "repositories": [
        {
          "name": "repository-name",
          "url": "https://github.com/username/repository-name",
          "status": "public", // or "private"
          "description": "Repository description",
          "language": "JavaScript",
          "license": "MIT",
          "lastUpdated": "2025-08-06T06:13:49Z",
          "topics": ["topic1", "topic2"],
          "forkCount": 5,
          "starCount": 10
        }
      ],
      "repositoryStats": {
        "total": 10,
        "public": 8,
        "private": 2
      },
      "scrapedAt": "2025-08-06T05:50:46.974Z"
    }
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

**Note**: GitHub data is stored as a single entity - only the most recently scraped user's data is kept. When a new GitHub user is scraped, it replaces the previous user's data. The scraping process now includes comprehensive repository information from all pages.

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