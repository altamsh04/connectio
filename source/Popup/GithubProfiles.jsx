// GithubProfiles.js
export const fetchGithubProfiles = async (setLoading) => {
    try {
      const username = prompt('Enter your GitHub username:');
      if (!username || username.trim() === '') {
        console.log('GitHub username prompt cancelled or empty');
        setLoading && setLoading(false);
        return;
      }
  
      setLoading && setLoading(true);
      console.log(`🐙 Fetching GitHub data for: ${username}`);
      
      // Fetch user profile
      const profileResponse = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Profile-Extension'
        }
      });
      
      if (!profileResponse.ok) {
        throw new Error(`GitHub user not found or API error: ${profileResponse.status}`);
      }
      
      const profileData = await profileResponse.json();
      console.log('✅ GitHub profile fetched:', profileData.login);
      
      // Fetch user repos
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Profile-Extension'
        }
      });
      
      if (!reposResponse.ok) {
        console.warn('Could not fetch repositories, but profile was successful');
      }
      
      const reposData = reposResponse.ok ? await reposResponse.json() : [];
      console.log(`✅ GitHub repositories fetched: ${reposData.length} repos`);
      
      // Save to chrome.storage.local
      const githubData = {
        [username]: {
          profile: profileData,
          repositories: reposData,
          fetchedAt: new Date().toISOString()
        }
      };
      
      await chrome.storage.local.set({
        github: githubData
      });
      
      console.log('✅ GitHub profile and repos saved to chrome.storage.local');
      setLoading && setLoading(false);
      
      return githubData;
      
    } catch (err) {
      console.error('❌ GitHub Fetch Error:', err);
      setLoading && setLoading(false);
      throw err; // Re-throw so the main handler can catch it
    }
  };
  
  export default fetchGithubProfiles;