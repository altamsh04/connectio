// Background script for handling GitHub profile scraping
console.log('Background script loaded successfully');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background script:', request);
  
  if (request.action === 'scrapeGitHubProfile') {
    console.log('Starting GitHub scraping process for:', request.username);
    handleGitHubScraping(request.username, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  // Add a ping test
  if (request.action === 'ping') {
    console.log('Ping received, responding with pong');
    sendResponse({ success: true, message: 'pong' });
    return true;
  }
});

async function handleGitHubScraping(username, sendResponse) {
  try {
    console.log(`Starting GitHub scraping for user: ${username}`);
    
    // Create a new tab for the GitHub profile
    const tab = await chrome.tabs.create({
      url: `https://github.com/${username}`,
      active: false
    });

    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Inject content script to scrape the profile
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeGitHubData,
      args: [username]
    });

    const scrapedData = results[0].result;
    
    // Store the scraped data
    await chrome.storage.local.set({
      [`github_${username}`]: {
        ...scrapedData,
        scrapedAt: new Date().toISOString()
      }
    });

    // Close the tab
    await chrome.tabs.remove(tab.id);

    console.log('GitHub scraping completed successfully:', scrapedData);
    sendResponse({ success: true, data: scrapedData });

  } catch (error) {
    console.error('Error during GitHub scraping:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to be injected into the GitHub page
function scrapeGitHubData(username) {
  const data = {
    username: username,
    profile: {},
    repositories: []
  };

  try {
    // Scrape profile information
    const profileSection = document.querySelector('[data-testid="user-profile"]') || 
                          document.querySelector('.profile-section') ||
                          document.querySelector('.js-profile-editable-area');

    if (profileSection) {
      // Profile name
      const nameElement = profileSection.querySelector('.vcard-names .p-name') ||
                         profileSection.querySelector('.vcard-names .p-nickname') ||
                         profileSection.querySelector('.vcard-names .p-org');
      data.profile.name = nameElement ? nameElement.textContent.trim() : username;

      // Bio
      const bioElement = profileSection.querySelector('.user-profile-bio') ||
                        profileSection.querySelector('.p-note');
      data.profile.bio = bioElement ? bioElement.textContent.trim() : '';

      // Location
      const locationElement = profileSection.querySelector('.vcard-details .p-label') ||
                             profileSection.querySelector('.vcard-details .Label--secondary');
      data.profile.location = locationElement ? locationElement.textContent.trim() : '';

      // Company
      const companyElement = profileSection.querySelector('.vcard-details .p-org') ||
                            profileSection.querySelector('.vcard-details .company');
      data.profile.company = companyElement ? companyElement.textContent.trim() : '';

      // Website
      const websiteElement = profileSection.querySelector('.vcard-details .Link--primary');
      data.profile.website = websiteElement ? websiteElement.href : '';

      // Followers and following
      const followersElement = document.querySelector('a[href*="/followers"] .Counter');
      const followingElement = document.querySelector('a[href*="/following"] .Counter');
      
      data.profile.followers = followersElement ? followersElement.textContent.trim() : '0';
      data.profile.following = followingElement ? followingElement.textContent.trim() : '0';
    }

    // Scrape repositories
    const repoElements = document.querySelectorAll('[data-testid="repository-card"]') ||
                        document.querySelectorAll('.repo-list-item') ||
                        document.querySelectorAll('.col-12.d-block.width-full.py-4.border-bottom.color-border-muted');

    repoElements.forEach((repoElement, index) => {
      if (index >= 10) return; // Limit to first 10 repos

      const repo = {};

      // Repository name
      const nameElement = repoElement.querySelector('a[data-testid="repository-link"]') ||
                         repoElement.querySelector('h3 a') ||
                         repoElement.querySelector('.wb-break-all a');
      repo.name = nameElement ? nameElement.textContent.trim() : '';

      // Repository description
      const descElement = repoElement.querySelector('[data-testid="repository-description"]') ||
                         repoElement.querySelector('.repo-list-description') ||
                         repoElement.querySelector('.color-fg-muted');
      repo.description = descElement ? descElement.textContent.trim() : '';

      // Programming language
      const langElement = repoElement.querySelector('[data-testid="repository-language"]') ||
                         repoElement.querySelector('.repo-language-color')?.nextElementSibling ||
                         repoElement.querySelector('.color-fg-muted');
      repo.language = langElement ? langElement.textContent.trim() : '';

      // Stars count
      const starsElement = repoElement.querySelector('a[href*="/stargazers"] .Counter') ||
                          repoElement.querySelector('.repo-stars');
      repo.stars = starsElement ? starsElement.textContent.trim() : '0';

      // Forks count
      const forksElement = repoElement.querySelector('a[href*="/forks"] .Counter') ||
                          repoElement.querySelector('.repo-forks');
      repo.forks = forksElement ? forksElement.textContent.trim() : '0';

      // Repository URL
      if (nameElement && nameElement.href) {
        repo.url = nameElement.href;
      }

      if (repo.name) {
        data.repositories.push(repo);
      }
    });

    // If no repositories found with the above selectors, try alternative approach
    if (data.repositories.length === 0) {
      const pinnedRepos = document.querySelectorAll('.pinned-item-list-item');
      pinnedRepos.forEach((repoElement, index) => {
        if (index >= 10) return;

        const repo = {};
        const nameElement = repoElement.querySelector('.repo');
        repo.name = nameElement ? nameElement.textContent.trim() : '';

        const descElement = repoElement.querySelector('.pinned-item-desc');
        repo.description = descElement ? descElement.textContent.trim() : '';

        const langElement = repoElement.querySelector('.repo-language-color')?.nextElementSibling;
        repo.language = langElement ? langElement.textContent.trim() : '';

        if (repo.name) {
          data.repositories.push(repo);
        }
      });
    }

  } catch (error) {
    console.error('Error scraping GitHub data:', error);
    data.error = error.message;
  }

  return data;
} 