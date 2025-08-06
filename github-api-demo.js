// GitHub API Demo - Shows how to fetch user data and repositories using the GitHub API
// This demonstrates the same functionality used in the Chrome extension

// Function to fetch user profile data using GitHub API
const fetchUserProfile = async (username) => {
  try {
    const url = `https://api.github.com/users/${username}`;
    const headers = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Mozilla/5.0'
    };
    
    const response = await fetch(url, { headers });
    
    if (response.status !== 200) {
      throw new Error(`User not found or API error: ${response.status}`);
    }
    
    const userData = await response.json();
    
    return {
      success: true,
      data: {
        profile: {
          fullName: userData.name || userData.login,
          username: userData.login,
          bio: userData.bio || '',
          location: userData.location || '',
          company: userData.company || '',
          avatarUrl: userData.avatar_url,
          profileUrl: userData.html_url,
          email: userData.email || '',
          blog: userData.blog || '',
          twitter: userData.twitter_username || '',
          hireable: userData.hireable || false,
          type: userData.type || 'User'
        },
        stats: {
          followers: userData.followers || 0,
          following: userData.following || 0,
          repositories: userData.public_repos || 0,
          publicGists: userData.public_gists || 0
        },
        scrapedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Error fetching user profile: ' + error.message
    };
  }
};

// Function to fetch all repositories using GitHub API
const fetchAllRepos = async (username) => {
  try {
    const repositories = [];
    let page = 1;
    
    while (true) {
      const url = `https://api.github.com/users/${username}/repos`;
      const params = new URLSearchParams({
        per_page: 100,  // Max allowed
        page: page,
        sort: 'updated'
      });
      
      const headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Mozilla/5.0'
      };
      
      const response = await fetch(url + '?' + params, { headers });
      
      if (response.status !== 200) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const pageData = await response.json();
      
      if (!pageData || pageData.length === 0) {
        break; // No more repos
      }
      
      for (const repo of pageData) {
        repositories.push({
          name: repo.name,
          description: repo.description || 'No description',
          language: repo.language || 'Not specified',
          last_updated: repo.updated_at,
          url: repo.html_url,
          full_name: repo.full_name,
          private: repo.private,
          fork: repo.fork,
          size: repo.size,
          stargazers_count: repo.stargazers_count,
          watchers_count: repo.watchers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          default_branch: repo.default_branch,
          created_at: repo.created_at,
          pushed_at: repo.pushed_at,
          topics: repo.topics || [],
          license: repo.license ? repo.license.name : null,
          homepage: repo.homepage,
          archived: repo.archived,
          disabled: repo.disabled
        });
      }
      
      page++;
      
      // Add a small delay between requests to be respectful to GitHub API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { repositories };
  } catch (error) {
    return { 
      repositories: [],
      error: 'Error fetching repositories: ' + error.message 
    };
  }
};

// Demo function to test the GitHub API
const demoGitHubAPI = async (username = 'octocat') => {
  console.log(`🚀 GitHub API Demo for username: ${username}`);
  console.log('=' .repeat(50));
  
  try {
    // Fetch user profile
    console.log('📋 Fetching user profile...');
    const profileResult = await fetchUserProfile(username);
    
    if (profileResult.success) {
      console.log('✅ Profile fetched successfully!');
      console.log('User Info:');
      console.log(`  Name: ${profileResult.data.profile.fullName}`);
      console.log(`  Username: ${profileResult.data.profile.username}`);
      console.log(`  Bio: ${profileResult.data.profile.bio}`);
      console.log(`  Location: ${profileResult.data.profile.location}`);
      console.log(`  Company: ${profileResult.data.profile.company}`);
      console.log(`  Followers: ${profileResult.data.stats.followers}`);
      console.log(`  Following: ${profileResult.data.stats.following}`);
      console.log(`  Public Repos: ${profileResult.data.stats.repositories}`);
    } else {
      console.log('❌ Profile fetch failed:', profileResult.error);
      return;
    }
    
    console.log('\n📚 Fetching repositories...');
    const repoResult = await fetchAllRepos(username);
    
    if (repoResult.repositories.length > 0) {
      console.log(`✅ Found ${repoResult.repositories.length} repositories!`);
      
      // Show first 3 repositories as examples
      console.log('\n📁 Sample Repositories:');
      repoResult.repositories.slice(0, 3).forEach((repo, index) => {
        console.log(`  ${index + 1}. ${repo.name}`);
        console.log(`     Description: ${repo.description}`);
        console.log(`     Language: ${repo.language}`);
        console.log(`     Stars: ${repo.stargazers_count}`);
        console.log(`     Forks: ${repo.forks_count}`);
        console.log(`     Private: ${repo.private ? 'Yes' : 'No'}`);
        console.log(`     URL: ${repo.url}`);
        console.log('');
      });
      
      // Calculate statistics
      const publicRepos = repoResult.repositories.filter(repo => !repo.private).length;
      const privateRepos = repoResult.repositories.filter(repo => repo.private).length;
      const forkRepos = repoResult.repositories.filter(repo => repo.fork).length;
      const archivedRepos = repoResult.repositories.filter(repo => repo.archived).length;
      
      console.log('📊 Repository Statistics:');
      console.log(`  Total: ${repoResult.repositories.length}`);
      console.log(`  Public: ${publicRepos}`);
      console.log(`  Private: ${privateRepos}`);
      console.log(`  Forks: ${forkRepos}`);
      console.log(`  Archived: ${archivedRepos}`);
      
    } else {
      console.log('❌ No repositories found or fetch failed:', repoResult.error);
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
};

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.demoGitHubAPI = demoGitHubAPI;
  window.fetchUserProfile = fetchUserProfile;
  window.fetchAllRepos = fetchAllRepos;
  console.log('GitHub API Demo functions loaded!');
  console.log('Usage: demoGitHubAPI("username")');
}

// Example usage:
// demoGitHubAPI('octocat');
// demoGitHubAPI('altamsh04'); 