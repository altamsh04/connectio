// SwiggyOrders.js
export const fetchSwiggyOrders = (setLoading) => {
    return new Promise((resolve, reject) => {
      setLoading && setLoading(true);
      
      chrome.cookies.getAll({ url: 'https://www.swiggy.com' }, async (cookies) => {
        try {
          const cookieMap = {};
          cookies.forEach((cookie) => {
            cookieMap[cookie.name] = cookie.value;
          });
          
          const headers = {
            'accept': '*/*',
            'accept-language': 'en-GB,en;q=0.5',
            'cookie': Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; '),
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': navigator.userAgent,
          };
          
          console.log('🛵 Fetching Swiggy orders...');
          
          let ordersCollection = [];
          let orderId = '';
          let pageCount = 0;
          const maxPages = 100; // Limit to prevent infinite loops
          
          // Fetch orders in batches (Swiggy uses pagination with order_id)
          while (pageCount < maxPages) {
            const url = new URL('https://www.swiggy.com/dapi/order/all');
            if (orderId) {
              url.searchParams.append('order_id', orderId);
            }
            
            const response = await fetch(url.toString(), {
              method: 'GET',
              headers,
              credentials: 'include',
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check if we have orders in the response
            if (!data.data || !data.data.orders || data.data.orders.length === 0) {
              console.log('📄 No more orders found, stopping pagination');
              break;
            }
            
            const orders = data.data.orders;
            ordersCollection = [...ordersCollection, ...orders];
            
            // Set the orderId for next iteration (last order's ID)
            orderId = orders[orders.length - 1]?.order_id;
            pageCount++;
            
            console.log(`📊 Fetched page ${pageCount}, total orders so far: ${ordersCollection.length}`);
            
            // If we got less than expected orders, we're likely at the end
            if (orders.length < 10) {
              break;
            }
            
            // Add a small delay to be respectful to Swiggy's servers
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Filter for delivered orders and process the data
          const processedOrders = ordersCollection
            .filter(order => order.order_delivery_status === 'delivered')
            .map(order => ({
              orderId: order.order_id,
              restaurantName: order.restaurant_name,
              orderTotal: order.order_total,
              orderDate: order.order_time,
              updatedAt: order.updated_at,
              deliveryStatus: order.order_delivery_status,
              items: order.order_items?.map(item => ({
                name: item.name,
                finalPrice: Number(item.final_price),
                quantity: Number(item.quantity),
                isVeg: item.is_veg === '1'
              })) || []
            }));
          
          console.log(`✅ Successfully processed ${processedOrders.length} delivered orders out of ${ordersCollection.length} total orders`);
          
          // Save to chrome storage
          chrome.storage.local.set({ 
            swiggy: {
              orders: processedOrders,
              totalOrders: ordersCollection.length,
              deliveredOrders: processedOrders.length,
              fetchedAt: new Date().toISOString()
            }
          }, () => {
            console.log('✅ Swiggy orders saved to chrome.storage.local');
            setLoading && setLoading(false);
            resolve(processedOrders);
          });
          
        } catch (err) {
          console.error('❌ Swiggy Fetch Error:', err);
          setLoading && setLoading(false);
          reject(err);
        }
      });
    });
  };
  
  export default fetchSwiggyOrders;