import React from 'react';
import { Zap, Link, Database, TestTube } from 'lucide-react';
import { getAllStoredGitHubData, testBackgroundScript } from '../handlers/buttonHandlers';

const Header = () => {
  const handleViewStoredData = async () => {
    try {
      const data = await getAllStoredGitHubData();
      
      if (Object.keys(data).length === 0) {
        alert('No GitHub data found in storage.');
        return;
      }
      
      let message = '📊 Stored GitHub Data:\n\n';
      
      Object.entries(data).forEach(([username, userData]) => {
        message += `👤 ${username}\n`;
        message += `   Name: ${userData.profile?.name || 'N/A'}\n`;
        message += `   Bio: ${userData.profile?.bio || 'N/A'}\n`;
        message += `   Location: ${userData.profile?.location || 'N/A'}\n`;
        message += `   Company: ${userData.profile?.company || 'N/A'}\n`;
        message += `   Followers: ${userData.profile?.followers || '0'}\n`;
        message += `   Following: ${userData.profile?.following || '0'}\n`;
        message += `   Repositories: ${userData.repositories?.length || 0}\n`;
        message += `   Scraped: ${new Date(userData.scrapedAt).toLocaleString()}\n\n`;
        
        if (userData.repositories && userData.repositories.length > 0) {
          message += '   📁 Top Repositories:\n';
          userData.repositories.slice(0, 3).forEach((repo, index) => {
            message += `      ${index + 1}. ${repo.name}\n`;
            message += `         ${repo.description || 'No description'}\n`;
            message += `         Language: ${repo.language || 'N/A'}\n`;
            message += `         Stars: ${repo.stars || '0'}\n\n`;
          });
        }
        message += '─'.repeat(50) + '\n\n';
      });
      
      alert(message);
    } catch (error) {
      console.error('Error viewing stored data:', error);
      alert('Error retrieving stored data: ' + error.message);
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
        <Zap className="text-white" size={24} />
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Connect.IO</h1>
      </div>
      <div className="flex items-center justify-center gap-1 mb-4">
        <Link size={14} className="text-white/70" />
        <p className="text-base text-white/90 font-normal max-w-md mx-auto">Connect your favorite apps to track development trends</p>
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
        <button
          onClick={handleTestBackground}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/20"
          title="Test background script"
        >
          <TestTube size={14} />
          Test
        </button>
      </div>
    </header>
  );
};

export default Header;
