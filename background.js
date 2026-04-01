// Auto Tiktok - Background Service Worker

// Abilita la sidebar per aprirsi al click sull'icona
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Auto Tiktok installed');
    
    // Initialize storage
    chrome.storage.local.set({
      extractedUsers: [],
      userList: [],
      comments: []
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward messages from content script to popup
  if (sender.tab) {
    // Message is from content script, forward to popup
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might be closed, ignore error
    });
  }
  return true;
});

// Keep service worker alive when needed
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
});
