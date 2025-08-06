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

        // 🔒 Clone and sanitize the response
        const sanitizedData = JSON.parse(JSON.stringify(rawData)); // deep clone

        const orders = sanitizedData?.orders?.entities?.ORDER;
        if (orders) {
          Object.values(orders).forEach((order) => {
            // Remove sensitive fields
            if (order.deliveryDetails) {
              delete order.deliveryDetails.deliveryAddress;
            }
            delete order.orderId;
            delete order.hashId;

            if (order.resInfo?.locality) {
              delete order.resInfo.locality.directionUrl;
              delete order.resInfo.locality.addressString;
            }
          });
        }

        // Save sanitized data to chrome.storage
        chrome.storage.local.set({
          zomato: {
            orders: sanitizedData,
            fetchedAt: new Date().toISOString()
          }
        }, () => {
          console.log('✅ Zomato orders saved to chrome.storage.local (sanitized):', sanitizedData);
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

export default fetchZomatoOrders;
