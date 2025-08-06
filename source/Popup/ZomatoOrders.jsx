// ZomatoOrders.js
export const fetchZomatoOrders = (setLoading) => {
  return new Promise((resolve, reject) => {
    setLoading && setLoading(true);
    
    chrome.cookies.getAll({ url: 'https://www.zomato.com' }, async (cookies) => {
      try {
        const cookieMap = {};
        cookies.forEach((cookie) => {
          cookieMap[cookie.name] = cookie.value;
        });
        
        const headers = {
          'accept': '*/*',
          'cookie': Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; '),
          'user-agent': navigator.userAgent,
        };
        
        console.log('🍽️ Fetching Zomato orders...');
        
        const response = await fetch('https://www.zomato.com/webroutes/user/orders', {
          method: 'GET',
          headers,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Save to chrome storage
        chrome.storage.local.set({ 
          zomato: {
            orders: data,
            fetchedAt: new Date().toISOString()
          }
        }, () => {
          console.log('✅ Zomato orders saved to chrome.storage.local:', data);
          setLoading && setLoading(false);
          resolve(data);
        });
        
      } catch (err) {
        console.error('❌ Zomato Fetch Error:', err);
        setLoading && setLoading(false);
        reject(err);
      }
    });
  });
};

export default fetchZomatoOrders;