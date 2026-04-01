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
  if (message.action === 'downloadMusic') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ success: true, downloadId });
    });
    return true;
  }

  if (message.action === 'fetchTikerMusic') {
    const videoUrl = message.videoUrl;
    if (!videoUrl) {
      sendResponse({ success: false, error: 'Missing videoUrl' });
      return true;
    }

    const findMusicUrlInResponse = (data) => {
      if (!data || typeof data !== 'object') return null;

      const directCandidates = [
        data.music,
        data.musicUrl,
        data.music_url,
        data.playUrl,
        data.play_url,
        data.audio,
        data.audioUrl,
        data.audio_url,
        data.url
      ];

      for (const value of directCandidates) {
        if (typeof value === 'string' && /^https?:\/\//.test(value)) {
          return value;
        }
      }

      const nestedObjects = [
        data.data,
        data.result,
        data.results,
        data.item,
        data.aweme,
        data.video
      ];

      for (const nested of nestedObjects) {
        const nestedUrl = findMusicUrlInResponse(nested);
        if (nestedUrl) return nestedUrl;
      }

      for (const value of Object.values(data)) {
        if (value && typeof value === 'object') {
          const nestedUrl = findMusicUrlInResponse(value);
          if (nestedUrl) return nestedUrl;
        }
      }

      return null;
    };

    fetch('https://tiker.io/api/tiktok', {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
        origin: 'https://tiker.io',
        referer: 'https://tiker.io/vi/download-tiktok-mp3'
      },
      body: JSON.stringify({ url: videoUrl })
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Tiker API failed: ${response.status}`);
        }
        const data = await response.json();
        const musicUrl = findMusicUrlInResponse(data);
        sendResponse({ success: !!musicUrl, musicUrl, raw: data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

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
