import React from 'react';
import { Zap, Link, Database, TestTube } from 'lucide-react';
import { testBackgroundScript } from '../handlers/githubHandler';

const Header = () => {
  const handleViewStoredData = async () => {
    try {
      // Open the standalone data viewer page in a new tab
      const dataViewerUrl = chrome.runtime.getURL('data-viewer-standalone.html');
      await chrome.tabs.create({ url: dataViewerUrl });
    } catch (error) {
      console.error('Error opening data viewer:', error);
      alert('Error opening data viewer: ' + error.message);
    }
  };

  const handleTestBackground = async () => {
    try {
      const result = await testBackgroundScript();
      if (result.success) {
        alert('✅ Background script is working! Response: ' + result.message);
      } else {
        alert('❌ Background script test failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Background script test error: ' + error.message);
    }
  };

  return (
    <header className="text-center mb-8 py-6">
      <div className="flex items-center justify-center gap-2 mb-3">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Connect.IO</h1>
      </div>
      <div className="flex items-center justify-center gap-1 mb-4">
        <p className="text-base text-white/90 font-normal max-w-md mx-auto">Connect your favorite apps to build your own AI Twin</p>
      </div>
      <div className="flex gap-2 justify-center">
        <button
          onClick={handleViewStoredData}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/20"
          title="View stored GitHub data"
        >
          <Database size={14} />
          View Data
        </button>
      </div>
    </header>
  );
};

export default Header;
