importScripts('zomatoHandler.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'FETCH_ZOMATO_ORDERS') {
    fetchZomatoOrders();
  }
});
