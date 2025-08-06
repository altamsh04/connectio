# Connect.IO

Connect.IO is a browser extension and API that helps developers and tech enthusiasts stay updated on trending GitHub repositories and related Twitter/X discussions in real-time. It fetches daily trending repos and matching tweets for a selected programming language, displaying them in a beautiful popup with a modern, side-by-side UI.

---

## Demo
<img width="867" height="762" alt="Image" src="https://github.com/user-attachments/assets/a7a7635c-6321-4d32-9e44-694362b224ad" />

---

## Architecture
<img width="1601" height="571" alt="Image" src="https://github.com/user-attachments/assets/73578e38-e22a-44a2-bc66-937fa5319803" />

---

## Features

- **Language Search Bar with Suggestions:**
  - Type to search for a programming language (default: Python).
  - Select from autocomplete suggestions.
  - Fetches trends for the selected language.
- **GitHub Trends:**
  - Shows the top trending repositories for the selected language.
  - Displays repo name, stars, description, and contributors.
  - External link icon to open the repo on GitHub.
- **Twitter/X Trends:**
  - Shows the top recent tweets mentioning the selected language.
  - Displays tweet text and author, with links to Twitter/X.
  - External link icon to open the tweet on Twitter/X.
- **Modern UI:**
  - Side-by-side card layout, monospace font, GitHub green and Twitter blue highlights.
  - Responsive and easy to use.
- **Caching:**
  - Results are cached per language for 1 hour for fast repeat access.

---

## API/Backend Setup

1. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```
2. **(Optional) Set up Twitter Bearer Token:**
   - For live Twitter data, set `TWITTER_BEARER_TOKEN` in your `.env` file.
   - For mock/demo, the API returns sample data by default.
3. **Start the API server:**
   ```bash
   npm start
   # or
   node index.js
   ```
   The API will run at `http://localhost:3001` by default.

---

## Extension Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
2. **Build the extension:**
   ```bash
   npm run build
   # or
   yarn build
   ```
3. **Load the extension in Chrome:**
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/chrome` directory

---

## Usage

1. **Open the Connect.IO popup** from your browser toolbar.
2. **Search for a language** in the search bar (e.g., "JavaScript", "Rust").
3. **Select a language** from the suggestions.
4. **Browse the two sections:**
   - **GitHub Trends:** Top trending repos for the language.
   - **Twitter/X Trends:** Top tweets mentioning the language.
5. **Click the external link icon** to open any repo or tweet in a new tab.

---

## API Endpoint

- `GET /api/v1/trend/language/:lang`
  - Returns `{ github: [...], twitter: [...] }` for the selected language.
  - Used by the extension popup for all data fetching.

---

## Credits

- Built by Altamsh Bairagdar
- GitHub trending data via [isboyjc/github-trending-api](https://github.com/isboyjc/github-trending-api)
- Twitter/X data via Twitter API v2

---

## License

MIT © Altamsh Bairagdar
