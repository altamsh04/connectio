# Connect.IO

A browser extension that aggregates and manages your data from multiple web services in one unified interface.

## 📋 Overview

Connect.IO is a personal data aggregation tool that allows you to:
- **Connect** to multiple web services (GitHub, Zomato, Swiggy, and more)
- **Collect** your data from these platforms automatically
- **View** all your data in a unified, searchable interface
- **Manage** and export your personal data across platforms

### 🎯 Supported Platforms

**Currently Available:**
- ✅ **GitHub** - Profile data, repositories, stats
- ✅ **Zomato** - Order history and data
- ✅ **Swiggy** - Order history and data

**Coming Soon:**
- 🔄 Twitter/X, Instagram, Reddit, Spotify, Netflix, Uber, ChatGPT, and 15+ more platforms

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 10.0.0)
- npm or yarn
- Chrome, Firefox, or Opera browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/altamsh04/connectio.git
   cd connectio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   # For Chrome
   npm run build:chrome
   
   # For Firefox
   npm run build:firefox
   
   # For all browsers
   npm run build
   ```

4. **Load the extension**
   - Open your browser's extension management page
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder from the project

## 🛠️ Development

### Development Mode
```bash
# Start development with hot reload for Chrome
npm run dev:chrome

# Start development with hot reload for Firefox
npm run dev:firefox
```

### Available Scripts
```bash
npm run dev:chrome      # Development build for Chrome
npm run dev:firefox     # Development build for Firefox
npm run build:chrome    # Production build for Chrome
npm run build:firefox   # Production build for Firefox
npm run build          # Build for all browsers
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

## 📁 Project Structure

```
connectio/
├── source/                    # Source code
│   ├── Background/           # Background scripts
│   ├── ContentScript/        # Content scripts
│   ├── DataViewer/          # Data viewing components
│   ├── Popup/               # Extension popup interface
│   ├── Options/             # Extension options page
│   ├── data/                # App configurations
│   └── manifest.json        # Extension manifest
├── extension/               # Built extension files
├── views/                   # HTML templates
└── webpack.config.js        # Build configuration
```

## 🔧 Configuration

### Adding New Platforms
1. Add platform details to `source/data/apps.json`
2. Create data fetching logic in `source/Popup/handlers/`
3. Update permissions in `source/manifest.json`
4. Add UI components as needed

### Environment Variables
- `NODE_ENV`: Set to `development` or `production`
- `TARGET_BROWSER`: Set to `chrome`, `firefox`, or `opera`

## 📊 Data Viewer

The extension includes a standalone data viewer accessible via:
- Extension popup → "View Data" button
- Direct URL: `chrome-extension://[id]/data-viewer-standalone.html`

### Features
- ✅ Chrome storage integration
- ✅ App filtering and data management
- ✅ Raw JSON data display
- ✅ Responsive design
- ✅ Export capabilities

## 🔐 Permissions

The extension requires these permissions:
- **Storage**: Save and retrieve user data
- **Active Tab**: Access current tab for data scraping
- **Scripting**: Inject content scripts
- **Host Permissions**: Access specific domains (GitHub, Twitter, etc.)

## 🐛 Troubleshooting

### Common Issues

**Build fails:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Extension not loading:**
- Ensure "Developer mode" is enabled
- Check browser console for errors
- Verify manifest.json is valid

**Data not fetching:**
- Check network connectivity
- Verify host permissions are granted
- Review browser console for API errors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [web-extension-starter](https://github.com/abhijithvijayan/web-extension-starter)
- UI components using [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Connect.IO** - Your personal data, unified and accessible.
