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

        const rawData = await response.json();

        // 🔥 NUCLEAR SANITIZATION - Remove ALL sensitive data
        const nukeAllSensitiveData = (obj) => {
          if (obj === null || obj === undefined) return obj;
          
          if (Array.isArray(obj)) {
            return obj.map(item => nukeAllSensitiveData(item));
          }
          
          if (typeof obj === 'object') {
            const cleaned = {};
            
            for (const [key, value] of Object.entries(obj)) {
              // 🚫 BLACKLISTED KEYS - DELETE COMPLETELY
              if (key === 'deliveryAddress' || 
                  key === 'orderId' || 
                  key === 'hashId' || 
                  key === 'directionUrl' || 
                  key === 'addressString') {
                console.log(`🔥 NUKED: ${key}`);
                continue; // Skip this key entirely
              }
              
              // 🧹 Clean nested objects/arrays recursively
              cleaned[key] = nukeAllSensitiveData(value);
            }
            
            return cleaned;
          }
          
          return obj;
        };

        // Apply nuclear sanitization
        console.log('🔥 STARTING NUCLEAR SANITIZATION...');
        const sanitizedData = nukeAllSensitiveData(rawData);
        console.log('✅ NUCLEAR SANITIZATION COMPLETE');

        // 🔍 VERIFICATION - Check if any sensitive data survived
        const dataString = JSON.stringify(sanitizedData);
        const sensitiveTerms = ['deliveryAddress', 'orderId', 'hashId', 'directionUrl', 'addressString'];
        
        console.log('🔍 VERIFICATION RESULTS:');
        sensitiveTerms.forEach(term => {
          const found = dataString.includes(`"${term}"`);
          console.log(`  ${found ? '❌ FOUND' : '✅ CLEAN'}: ${term}`);
        });

        // Save completely sanitized data
        chrome.storage.local.set({
          zomato: {
            orders: sanitizedData,
            fetchedAt: new Date().toISOString(),
            sanitized: true,
            sanitizationMethod: 'nuclear'
          }
        }, () => {
          const orderCount = Object.keys(sanitizedData?.orders?.entities?.ORDER || {}).length;
          console.log(`✅ CLEAN Zomato orders saved: ${orderCount} orders`);
          setLoading && setLoading(false);
          resolve(sanitizedData);
        });

      } catch (err) {
        console.error('❌ Zomato Fetch Error:', err);
        setLoading && setLoading(false);
        reject(err);
      }
    });
  });
};

// Nuclear sanitization for already stored data
export const nukeSensitiveDataFromStorage = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['zomato'], (result) => {
      if (!result.zomato?.orders) {
        console.log('No stored Zomato data to sanitize');
        resolve(null);
        return;
      }

      console.log('🔥 NUKING STORED DATA...');

      const nukeAllSensitiveData = (obj) => {
        if (obj === null || obj === undefined) return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(item => nukeAllSensitiveData(item));
        }
        
        if (typeof obj === 'object') {
          const cleaned = {};
          
          for (const [key, value] of Object.entries(obj)) {
            if (key === 'deliveryAddress' || 
                key === 'orderId' || 
                key === 'hashId' || 
                key === 'directionUrl' || 
                key === 'addressString') {
              continue; // NUKE IT
            }
            
            cleaned[key] = nukeAllSensitiveData(value);
          }
          
          return cleaned;
        }
        
        return obj;
      };

      const cleanData = nukeAllSensitiveData(result.zomato.orders);

      chrome.storage.local.set({
        zomato: {
          ...result.zomato,
          orders: cleanData,
          sanitized: true,
          sanitizationMethod: 'nuclear'
        }
      }, () => {
        console.log('✅ STORED DATA NUKED SUCCESSFULLY');
        resolve(cleanData);
      });
    });
  });
};

export default fetchZomatoOrders;