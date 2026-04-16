// Auto Tiktok - Content Script
(function() {
  if (window.TikTokBotProLoaded) {
    console.log('Auto Tiktok: Already loaded');
    return;
  }
  window.TikTokBotProLoaded = true;
  
  window.TIKTOK_BOT_STOP = false;
  
  console.log('Auto Tiktok: Loaded on', window.location.href);
  
  // ============ FLOATING POPUP ============
  
  let floatingPopup = null;
  
  function createFloatingPopup() {
    if (floatingPopup) return;
    
    floatingPopup = document.createElement('div');
    floatingPopup.id = 'tiktok-bot-floating-popup';
    floatingPopup.innerHTML = `
      <div class="tiktok-bot-popup-header">
        <span class="tiktok-bot-popup-title">🤖 Auto Tiktok</span>
        <button class="tiktok-bot-popup-minimize" id="tiktok-bot-minimize">−</button>
      </div>
      <div class="tiktok-bot-popup-body" id="tiktok-bot-popup-body">
        <div class="tiktok-bot-popup-status" id="tiktok-bot-status">Đang bắt đầu...</div>
        <div class="tiktok-bot-popup-progress">
          <span id="tiktok-bot-progress-text">0 / 0</span>
          <div class="tiktok-bot-popup-progress-bar">
            <div class="tiktok-bot-popup-progress-fill" id="tiktok-bot-progress-fill"></div>
          </div>
        </div>
        <div class="tiktok-bot-popup-log" id="tiktok-bot-log"></div>
        <button class="tiktok-bot-popup-stop" id="tiktok-bot-stop">⏹ STOP</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #tiktok-bot-floating-popup {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 280px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .tiktok-bot-popup-header {
        background: linear-gradient(90deg, #fe2c55 0%, #25f4ee 100%);
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      }
      .tiktok-bot-popup-title {
        font-weight: 600;
        font-size: 13px;
      }
      .tiktok-bot-popup-minimize {
        background: rgba(255,255,255,0.2);
        border: none;
        color: #fff;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      }
      .tiktok-bot-popup-minimize:hover {
        background: rgba(255,255,255,0.3);
      }
      .tiktok-bot-popup-body {
        padding: 12px;
      }
      .tiktok-bot-popup-body.minimized {
        display: none;
      }
      .tiktok-bot-popup-status {
        font-size: 12px;
        color: #25f4ee;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tiktok-bot-popup-progress {
        margin-bottom: 8px;
      }
      #tiktok-bot-progress-text {
        font-size: 11px;
        color: #888;
      }
      .tiktok-bot-popup-progress-bar {
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        margin-top: 4px;
        overflow: hidden;
      }
      .tiktok-bot-popup-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #fe2c55 0%, #25f4ee 100%);
        width: 0%;
        transition: width 0.3s ease;
      }
      .tiktok-bot-popup-log {
        max-height: 80px;
        overflow-y: auto;
        font-size: 10px;
        color: #aaa;
        margin-bottom: 10px;
        background: rgba(0,0,0,0.2);
        border-radius: 6px;
        padding: 6px;
      }
      .tiktok-bot-popup-log div {
        padding: 2px 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .tiktok-bot-popup-log div:last-child {
        border-bottom: none;
      }
      .tiktok-bot-popup-log .success { color: #4ade80; }
      .tiktok-bot-popup-log .error { color: #f87171; }
      .tiktok-bot-popup-stop {
        width: 100%;
        padding: 10px;
        background: #fe2c55;
        border: none;
        border-radius: 8px;
        color: #fff;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tiktok-bot-popup-stop:hover {
        background: #e91e43;
        transform: scale(1.02);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(floatingPopup);
    
    // Stop button
    document.getElementById('tiktok-bot-stop').addEventListener('click', () => {
      window.TIKTOK_BOT_STOP = true;
      chrome.storage.local.remove(['pendingTask']);
      updateFloatingPopup('Đã dừng bởi người dùng', 0, 0);
      setTimeout(() => removeFloatingPopup(), 2000);
    });
    
    // Minimize button
    document.getElementById('tiktok-bot-minimize').addEventListener('click', () => {
      const body = document.getElementById('tiktok-bot-popup-body');
      const btn = document.getElementById('tiktok-bot-minimize');
      body.classList.toggle('minimized');
      btn.textContent = body.classList.contains('minimized') ? '+' : '−';
    });
    
    // Make draggable
    makeDraggable(floatingPopup);
  }
  
  function makeDraggable(element) {
    const header = element.querySelector('.tiktok-bot-popup-header');
    let offsetX, offsetY, isDragging = false;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - element.offsetLeft;
      offsetY = e.clientY - element.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      element.style.left = (e.clientX - offsetX) + 'px';
      element.style.top = (e.clientY - offsetY) + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  function updateFloatingPopup(status, current, total) {
    if (!floatingPopup) return;
    
    document.getElementById('tiktok-bot-status').textContent = status;
    document.getElementById('tiktok-bot-progress-text').textContent = `${current} / ${total}`;
    const percent = total > 0 ? (current / total) * 100 : 0;
    document.getElementById('tiktok-bot-progress-fill').style.width = percent + '%';
  }
  
  function addFloatingLog(message, type = '') {
    if (!floatingPopup) return;
    
    const log = document.getElementById('tiktok-bot-log');
    const div = document.createElement('div');
    div.className = type;
    div.textContent = message;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    
    // Keep only last 10 messages
    while (log.children.length > 10) {
      log.removeChild(log.firstChild);
    }
  }
  
  function removeFloatingPopup() {
    if (floatingPopup) {
      floatingPopup.remove();
      floatingPopup = null;
    }
  }
  
  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Auto Tiktok: Message received:', message.action);
    
    if (message.action === 'stop') {
      console.log('Auto Tiktok: *** STOP SIGNAL RECEIVED ***');
      window.TIKTOK_BOT_STOP = true;
      chrome.storage.local.remove(['pendingTask']);
      sendResponse({ status: 'stopped' });
    } else if (message.action === 'ping') {
      sendResponse({ status: 'ok' });
    }
    return true;
  });
  
  // ============ UTILITIES ============
  
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Check stop - returns true if should stop
  async function shouldStop() {
    if (window.TIKTOK_BOT_STOP) return true;
    const { pendingTask } = await chrome.storage.local.get(['pendingTask']);
    if (!pendingTask) {
      window.TIKTOK_BOT_STOP = true;
      return true;
    }
    return false;
  }
  
  function sendProgress(type, data) {
    try { chrome.runtime.sendMessage({ type, ...data }); } catch(e) {}
  }
  
  // Add ?lang=en to any TikTok URL
  function withLangEn(url) {
    try {
      const u = new URL(url, location.href);
      u.searchParams.set('lang', 'en');
      return u.toString();
    } catch {
      const [base, hash] = String(url).split('#');
      const sep = base.includes('?') ? '&' : '?';
      const out = base.includes('lang=') ? base.replace(/([?&])lang=[^&]*/, '$1lang=en') : (base + sep + 'lang=en');
      return hash ? out + '#' + hash : out;
    }
  }

  // ============ MUSIC DOWNLOAD ============
  let currentVideoElement = null;

  // Lấy video ID theo ưu tiên giống luồng mở video/comment
  function extractVideoId(container) {
    // 1) Khi đang ở modal/video page thì URL là nguồn đáng tin cậy nhất
    const idFromUrl = window.location.href.match(/\/video\/(\d+)/)?.[1];
    if (idFromUrl) return idFromUrl;

    // 2) Dùng cache từ fetch hook nếu có
    if (window.__LAST_VIDEO_ID) return window.__LAST_VIDEO_ID;

    // 3) Tìm ID từ các link video trong trang
    const linkCandidates = [
      container,
      currentVideoElement,
      document.querySelector('[data-e2e="browse-video"]'),
      document
    ];
    for (const root of linkCandidates) {
      if (!root?.querySelector) continue;
      const idFromLink = root.querySelector('a[href*="/video/"]')?.getAttribute('href')?.match(/\/video\/(\d+)/)?.[1];
      if (idFromLink) return idFromLink;
    }

    // 4) Fallback từ data attributes
    const idAttr = container?.getAttribute?.('data-e2e-video-id') ||
      currentVideoElement?.getAttribute?.('data-e2e-video-id');
    if (idAttr) return idAttr;

    return null;
  }

  function extractVideoUrl(container, videoId) {
    const candidateUrls = [];

    if (window.location.href.includes('/video/')) {
      candidateUrls.push(window.location.href);
    }

    const linkCandidates = [
      container,
      currentVideoElement,
      document.querySelector('[data-e2e="browse-video"]'),
      document
    ];

    for (const root of linkCandidates) {
      if (!root?.querySelector) continue;
      const href = root.querySelector('a[href*="/video/"]')?.getAttribute('href');
      if (!href) continue;
      try {
        const absUrl = new URL(href, location.origin).toString();
        candidateUrls.push(absUrl);
      } catch (e) {}
    }

    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonical && canonical.includes('/video/')) {
      candidateUrls.push(canonical);
    }

    if (videoId) {
      candidateUrls.push(`https://www.tiktok.com/video/${videoId}`);
    }

    const finalUrl = candidateUrls.find((url) => /\/video\/\d+/.test(url));
    return finalUrl ? withLangEn(finalUrl) : null;
  }

  function openMp3FallbackDownloader(videoUrl) {
    if (!videoUrl) {
      alert('Không tìm thấy link video để chuyển đổi MP3');
      return;
    }

    const fallbackUrl = `https://tiker.io/vi/download-tiktok-mp3?url=${encodeURIComponent(videoUrl)}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }

  let tikerMediaCache = { key: null, payload: null };

  async function fetchTikerMedia(videoUrl, videoId) {
    if (!videoUrl) return { musicUrl: null, play: null };

    if (tikerMediaCache.key === videoUrl && tikerMediaCache.payload) {
      return tikerMediaCache.payload;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'fetchTikerMusic',
        videoUrl
      });

      const musicUrl = (response?.success && response.musicUrl) ? response.musicUrl : null;
      const play = (typeof response?.play === 'string' && /^https?:\/\//.test(response.play))
        ? response.play
        : null;

      if (musicUrl) window.__LAST_MUSIC_URL = musicUrl;
      if (musicUrl || play) window.__LAST_VIDEO_ID = videoId || null;

      const payload = { musicUrl, play };
      if (musicUrl || play) tikerMediaCache = { key: videoUrl, payload };
      return payload;
    } catch (e) {
      return { musicUrl: null, play: null };
    }
  }

  async function getMusicPlayUrl(videoUrl, videoId) {
    const { musicUrl } = await fetchTikerMedia(videoUrl, videoId);
    return musicUrl;
  }

  async function initMusicDownloadFeature() {
    const handleMusicDownload = async (container) => {
      const videoId = extractVideoId(container);
      if (!videoId) {
        alert('Không tìm thấy video ID');
        return;
      }

      const videoUrl = extractVideoUrl(container, videoId);
      const musicUrl = await getMusicPlayUrl(videoUrl, videoId);
      if (musicUrl) {
        chrome.runtime.sendMessage({
          action: 'downloadMusic',
          url: musicUrl,
          filename: `tiktok-music-${Date.now()}.mp3`
        });
      } else {
        openMp3FallbackDownloader(videoUrl);
        alert('Không lấy được link nhạc trực tiếp. Đã mở Tiker để chuyển đổi MP3.');
      }
    };

    const handleVideoNoLogoDownload = async (container) => {
      const videoId = extractVideoId(container);
      if (!videoId) {
        alert('Không tìm thấy video ID');
        return;
      }

      const videoUrl = extractVideoUrl(container, videoId);
      const { play } = await fetchTikerMedia(videoUrl, videoId);
      if (play) {
        chrome.runtime.sendMessage({
          action: 'downloadVideo',
          url: play,
          filename: `tiktok-video-no-logo-${Date.now()}.mp4`
        });
      } else {
        alert('Không lấy được link video (trường play).');
      }
    };

    if (window.__TIKTOK_MUSIC_DL_READY) return;
    window.__TIKTOK_MUSIC_DL_READY = true;

    // Read toggles from popup (chrome.storage.local)
    let musicDownloadEnabled = true;
    let videoDownloadEnabled = true;
    try {
      const cfg = await chrome.storage.local.get(['enableMusicDownload', 'enableVideoDownload']);
      musicDownloadEnabled = cfg.enableMusicDownload !== false;
      videoDownloadEnabled = cfg.enableVideoDownload !== false;
    } catch (e) {}

    const containerSelector = [
      'div[data-e2e="feed-video"]',
      'div[data-e2e="video-item"]',
      'div[data-e2e="recommend-list-item-container"]',
      'div[class*="DivVideoContainer"]',
      'div[class*="DivItemContainer"]',
      'div.tiktok-1c7urtf'
    ].join(', ');

    const dlBtnSharedStyle = `
      position: absolute; right: 12px; z-index: 9999;
      background: #ff2d55; color: white; border: none; padding: 5px 9px;
      border-radius: 9999px; font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      opacity: 0; pointer-events: none; transform: translateY(-4px); transition: opacity .18s ease, transform .18s ease;
    `;

    const attachDlHover = (container) => {
      if (container.dataset.tiktokDlWired) return;
      container.dataset.tiktokDlWired = '1';
      const showDlButtons = () => {
        container.querySelectorAll('.tiktok-music-dl-btn, .tiktok-video-wm-dl-btn').forEach((b) => {
          b.style.opacity = '1';
          b.style.pointerEvents = 'auto';
          b.style.transform = 'translateY(0)';
        });
      };
      const hideDlButtons = () => {
        container.querySelectorAll('.tiktok-music-dl-btn, .tiktok-video-wm-dl-btn').forEach((b) => {
          b.style.opacity = '0';
          b.style.pointerEvents = 'none';
          b.style.transform = 'translateY(-4px)';
        });
      };
      container.addEventListener('mouseenter', showDlButtons);
      container.addEventListener('mouseleave', hideDlButtons);
    };

    const updateDlButtonsForContainer = (container) => {
      const hasMusic = container.querySelector('.tiktok-music-dl-btn');
      const hasVideo = container.querySelector('.tiktok-video-wm-dl-btn');

      if (musicDownloadEnabled) {
        if (!hasMusic) {
          const btn = document.createElement('button');
          btn.className = 'tiktok-music-dl-btn';
          btn.innerHTML = '♫ Tải nhạc';
          btn.style.cssText = `top: 12px; ${dlBtnSharedStyle}`;
          container.appendChild(btn);
          btn.addEventListener('click', async (e) => {
            e.stopImmediatePropagation();
            await handleMusicDownload(container);
          });
        }
      } else if (hasMusic) {
        hasMusic.remove();
      }

      if (videoDownloadEnabled) {
        if (!hasVideo) {
          const vbtn = document.createElement('button');
          vbtn.className = 'tiktok-video-wm-dl-btn';
          vbtn.textContent = '⬇ Video (no logo)';
          vbtn.style.cssText = `top: 48px; ${dlBtnSharedStyle}`;
          container.appendChild(vbtn);
          vbtn.addEventListener('click', async (e) => {
            e.stopImmediatePropagation();
            await handleVideoNoLogoDownload(container);
          });
        }
      } else if (hasVideo) {
        hasVideo.remove();
      }
    };

    const processVideoContainers = () => {
      const videoContainers = document.querySelectorAll(containerSelector);
      videoContainers.forEach((container) => {
        if (!container.querySelector('video')) return;

        container.style.position = 'relative';
        updateDlButtonsForContainer(container);

        attachDlHover(container);
      });
    };

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      const musicChanged = Object.prototype.hasOwnProperty.call(changes, 'enableMusicDownload');
      const videoChanged = Object.prototype.hasOwnProperty.call(changes, 'enableVideoDownload');
      if (!musicChanged && !videoChanged) return;

      if (musicChanged) musicDownloadEnabled = changes.enableMusicDownload.newValue !== false;
      if (videoChanged) videoDownloadEnabled = changes.enableVideoDownload.newValue !== false;

      processVideoContainers();
    });

    const observer = new MutationObserver(() => {
      processVideoContainers();
      document.querySelectorAll('video').forEach((v) => {
        intersectionObserver.observe(v.parentElement || v);
      });
    });

    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          currentVideoElement = entry.target;
        }
      });
    }, { threshold: 0.6 });

    processVideoContainers();
    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('video').forEach((v) => intersectionObserver.observe(v.parentElement || v));
  }
  
  // ============ IMPROVED CLICK ============
  
  async function click(el) {
    if (!el) return false;
    
    // Scroll into view
    el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    await sleep(300);
    
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Get the actual element at that point
    let target = document.elementFromPoint(x, y);
    if (!target) target = el;
    
    // If target is inside el, use target; otherwise use el
    if (!el.contains(target) && target !== el) {
      target = el;
    }
    
    const classStr = typeof target.className === 'string' ? target.className : (target.className?.baseVal || '');
    console.log('Auto Tiktok: Clicking', target.tagName, classStr.substring(0, 50));
    
    // Method 1: Direct click
    try {
      target.click();
    } catch(e) {}
    
    await sleep(100);
    
    // Method 2: MouseEvents with coordinates
    const eventOpts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
      button: 0,
      buttons: 1
    };
    
    target.dispatchEvent(new MouseEvent('mouseenter', eventOpts));
    target.dispatchEvent(new MouseEvent('mouseover', eventOpts));
    target.dispatchEvent(new MouseEvent('mousedown', eventOpts));
    await sleep(50);
    target.dispatchEvent(new MouseEvent('mouseup', eventOpts));
    target.dispatchEvent(new MouseEvent('click', eventOpts));
    
    // Method 3: Pointer events
    try {
      target.dispatchEvent(new PointerEvent('pointerdown', { ...eventOpts, pointerId: 1, pointerType: 'mouse' }));
      await sleep(50);
      target.dispatchEvent(new PointerEvent('pointerup', { ...eventOpts, pointerId: 1, pointerType: 'mouse' }));
    } catch(e) {}
    
    // Method 4: Focus and Enter key for buttons
    if (target.tagName === 'BUTTON' || target.role === 'button') {
      try {
        target.focus();
        await sleep(50);
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
      } catch(e) {}
    }
    
    return true;
  }
  
  // ============ VIDEO FUNCTIONS ============
  
  async function clickFirstVideo() {
    const selectors = [
      'div[data-e2e="challenge-item"]',
      'div[data-e2e="user-post-item"]', 
      'div[data-e2e="user-post-item-list"] > div',
      '[class*="DivItemContainerV2"]',
      '[class*="DivItemContainer"]'
    ];
    
    for (const sel of selectors) {
      const items = document.querySelectorAll(sel);
      if (items.length > 0) {
        console.log('Auto Tiktok: Found video items with:', sel, 'count:', items.length);
        const item = items[0];
        
        // Try to find the actual clickable element inside
        const clickable = item.querySelector('a[href*="/video/"]') || 
                         item.querySelector('div[class*="DivWrapper"]') ||
                         item;
        
        await click(clickable);
        await sleep(2000);
        return true;
      }
    }
    
    // Last resort: any video link
    const link = document.querySelector('a[href*="/video/"]');
    if (link) {
      await click(link);
      await sleep(2000);
      return true;
    }
    
    return false;
  }
  
  function isVideoModalOpen() {
    return !!(
      document.querySelector('[data-e2e="browse-video"]') ||
      document.querySelector('[data-e2e="browse-like-icon"]') ||
      document.querySelector('[class*="DivBrowserMode"]') ||
      document.querySelector('[data-e2e="arrow-right"]') ||
      document.querySelector('[class*="DivVideoPlayerContainer"]')
    );
  }
  
  async function waitForVideoModal(timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await shouldStop()) return false;
      if (isVideoModalOpen()) {
        await sleep(1500);
        return true;
      }
      await sleep(500);
    }
    return false;
  }
  
  async function waitPageReady() {
    await sleep(2000);
    for (let i = 0; i < 30; i++) {
      if (await shouldStop()) return false;
      if (document.querySelector('div[data-e2e="challenge-item"]') ||
          document.querySelector('div[data-e2e="user-post-item"]') ||
          document.querySelector('a[href*="/video/"]') ||
          document.querySelector('[data-e2e="like-icon"]') ||
          document.querySelector('[data-e2e="browse-like-icon"]')) {
        return true;
      }
      await sleep(500);
    }
    return false;
  }
  
  // ============ LIKE FUNCTION ============
  
  async function doLike(wantLike) {
    console.log('Auto Tiktok: doLike, wantLike:', wantLike);
    
    // Find the span with data-e2e="browse-like-icon" or "like-icon"
    let likeSpan = document.querySelector('span[data-e2e="browse-like-icon"]') ||
                   document.querySelector('span[data-e2e="like-icon"]');
    
    // Get parent button to check state
    let btn = likeSpan?.closest('button');
    
    // Fallback: find button by aria-label containing "Like" 
    if (!btn) {
      const buttons = document.querySelectorAll('button[aria-label]');
      for (const b of buttons) {
        const label = b.getAttribute('aria-label') || '';
        // Match "123 Likes" or "Like" but not "Unlike"
        if (/\d*\.?\d*[KMB]?\s*Like/i.test(label) && !label.toLowerCase().includes('unlike')) {
          btn = b;
          likeSpan = b.querySelector('span') || b;
          console.log('Auto Tiktok: Found like button via aria-label:', label);
          break;
        }
      }
    }
    
    if (!btn || !likeSpan) {
      console.log('Auto Tiktok: Like button NOT FOUND');
      return false;
    }
    
    // Check if already liked using aria-pressed attribute
    const isLiked = btn.getAttribute('aria-pressed') === 'true';
    
    console.log('Auto Tiktok: aria-pressed:', btn.getAttribute('aria-pressed'), 'isLiked:', isLiked, 'wantLike:', wantLike);
    
    // If already in desired state, skip
    if ((wantLike && isLiked) || (!wantLike && !isLiked)) {
      console.log('Auto Tiktok: Already in desired state, skipping');
      return true;
    }
    
    // Click on the span element
    console.log('Auto Tiktok: Clicking like span...');
    await click(likeSpan);
    await sleep(1000);
    
    // Verify the click worked
    const newState = btn.getAttribute('aria-pressed') === 'true';
    console.log('Auto Tiktok: After click, aria-pressed:', newState);
    
    return true;
  }
  
  // ============ COMMENT FUNCTION ============
  
  async function doComment(comments) {
    const text = comments[Math.floor(Math.random() * comments.length)];
    console.log('Auto Tiktok: Commenting:', text);
    
    // Find the contenteditable div inside DraftEditor
    const textarea = document.querySelector("div[class*='DivInputAreaContainer'] div[contenteditable='true']");
    
    if (!textarea) {
      console.log('Auto Tiktok: Textarea not found');
      return false;
    }
    
    console.log('Auto Tiktok: Found textarea');
    
    // Scroll and click
    textarea.scrollIntoView({ block: 'center' });
    await sleep(300);
    textarea.click();
    await sleep(300);
    textarea.focus();
    await sleep(300);
    
    // Type each character - this is what works with DraftJS
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // KeyboardEvent for keydown
      textarea.dispatchEvent(new KeyboardEvent('keydown', {
        key: char,
        code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
        keyCode: char.charCodeAt(0),
        which: char.charCodeAt(0),
        bubbles: true,
        cancelable: true
      }));
      
      // This is the key: beforeinput event that DraftJS listens to
      textarea.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: char,
        bubbles: true,
        cancelable: true
      }));
      
      // TextEvent (deprecated but some editors still use it)
      try {
        const textEvent = document.createEvent('TextEvent');
        textEvent.initTextEvent('textInput', true, true, window, char);
        textarea.dispatchEvent(textEvent);
      } catch(e) {}
      
      // Input event
      textarea.dispatchEvent(new InputEvent('input', {
        inputType: 'insertText',
        data: char,
        bubbles: true,
        cancelable: false
      }));
      
      // KeyboardEvent for keyup
      textarea.dispatchEvent(new KeyboardEvent('keyup', {
        key: char,
        code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
        keyCode: char.charCodeAt(0),
        which: char.charCodeAt(0),
        bubbles: true,
        cancelable: true
      }));
      
      // Small delay between characters
      await sleep(20);
    }
    
    await sleep(1500);
    
    // Find and click Post button
    const postBtn = document.querySelector('button[data-e2e="comment-post"]');
    
    if (postBtn && !postBtn.disabled && postBtn.getAttribute('aria-disabled') !== 'true') {
      console.log('Auto Tiktok: Clicking Post button');
      postBtn.click();
      
      // Wait for comment to be posted
      await sleep(2000);
      
      // Click "Leave" button if confirmation dialog appears
      for (let attempt = 0; attempt < 5; attempt++) {
        // Look for the Leave modal
        const leaveModal = document.querySelector('div[class*="DivLeaveModalContainer"]');
        if (leaveModal) {
          const leaveBtn = leaveModal.querySelector('div[class*="DivConfirmButton"]');
          if (leaveBtn) {
            console.log('Auto Tiktok: Found Leave button, clicking...');
            leaveBtn.click();
            await sleep(1000);
            break;
          }
        }
        await sleep(500);
      }
      
      return true;
    }
    
    console.log('Auto Tiktok: Post button disabled or not found');
    
    // Even if failed, try to clear the textarea
    console.log('Auto Tiktok: Clearing textarea after failure...');
    textarea.blur();
    
    // Select all and delete
    textarea.focus();
    await sleep(200);
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await sleep(300);
    textarea.blur();
    
    return false;
  }
  
  // ============ NAVIGATION ============
  
  // Helper function to click Leave button if present
  async function clickLeaveIfPresent() {
    const leaveModal = document.querySelector('div[class*="DivLeaveModalContainer"]');
    if (leaveModal) {
      const leaveBtn = leaveModal.querySelector('div[class*="DivConfirmButton"]');
      if (leaveBtn) {
        console.log('Auto Tiktok: Found Leave modal, clicking Leave...');
        leaveBtn.click();
        await sleep(1000);
        return true;
      }
    }
    return false;
  }
  
  async function nextVideo() {
    console.log('Auto Tiktok: nextVideo() called');
    
    // First check if there's a Leave confirmation dialog
    await clickLeaveIfPresent();
    
    const btn = document.querySelector('[data-e2e="arrow-right"]');
    if (btn && !btn.disabled) {
      console.log('Auto Tiktok: Found arrow-right button, clicking...');
      btn.click();
      await sleep(1500);
      
      // Check again for Leave dialog after clicking
      await clickLeaveIfPresent();
      
      await sleep(500);
      return true;
    }
    
    // Fallback: keyboard ArrowDown
    console.log('Auto Tiktok: Using keyboard ArrowDown');
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'ArrowDown', 
      code: 'ArrowDown', 
      keyCode: 40,
      which: 40,
      bubbles: true 
    }));
    await sleep(1500);
    
    // Check again for Leave dialog
    await clickLeaveIfPresent();
    
    await sleep(500);
    return true;
  }
  
  async function closeModal() {
    const closeBtn = document.querySelector('[data-e2e="browse-close"]') ||
                    document.querySelector('button[aria-label*="Close" i]');
    if (closeBtn) {
      await click(closeBtn);
      await sleep(1000);
      return;
    }
    
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Escape', 
      code: 'Escape',
      keyCode: 27,
      bubbles: true 
    }));
    await sleep(1000);
  }
  
  // ============ TASK RUNNERS ============
  
  async function runAutoLike(task) {
    const { targetType, likeAction, hashtag, userList, maxPosts, delayMin, delayMax } = task;
    const postsPerUser = task.postsPerUser || 1;
    let processed = task.processed || 0;
    const wantLike = likeAction === 'like';
    
    console.log('Auto Tiktok: === runAutoLike ===', targetType, 'processed:', processed, 'max:', maxPosts, 'postsPerUser:', postsPerUser);
    
    // Show floating popup
    createFloatingPopup();
    updateFloatingPopup('Bắt đầu tự động like...', 0, maxPosts);
    
    if (!await waitPageReady()) {
      console.log('Auto Tiktok: Page not ready or stopped');
      removeFloatingPopup();
      return;
    }
    
    if (targetType === 'hashtag') {
      const tag = hashtag.replace('#', '');
      
      // Navigate to hashtag if needed
      if (!location.href.includes(`/tag/${tag}`)) {
        await chrome.storage.local.set({ pendingTask: { ...task, processed } });
        location.href = withLangEn(`https://www.tiktok.com/tag/${tag}`);
        return;
      }
      
      // Open video modal if not open
      if (!isVideoModalOpen()) {
        console.log('Auto Tiktok: Opening video modal...');
        await sleep(2000);
        if (!await clickFirstVideo()) {
          sendProgress('error', { message: 'Không tìm thấy video trên trang' });
          sendProgress('likeComplete', {});
          await chrome.storage.local.remove(['pendingTask']);
          removeFloatingPopup();
          return;
        }
        if (!await waitForVideoModal()) {
          sendProgress('error', { message: 'Không thể mở cửa sổ video' });
          sendProgress('likeComplete', {});
          await chrome.storage.local.remove(['pendingTask']);
          removeFloatingPopup();
          return;
        }
      }
      
      console.log('Auto Tiktok: Starting like loop...');
      
      // Process videos
      for (let i = processed; i < maxPosts; i++) {
        
        
        // *** CRITICAL: Check stop at start of each iteration ***
        if (await shouldStop()) {
          console.log('Auto Tiktok: *** STOPPED BY USER ***');
          sendProgress('likeComplete', {});
          removeFloatingPopup();
          return;
        }
        
        console.log('Auto Tiktok: Processing video', i + 1, 'of', maxPosts);
        updateFloatingPopup(`Video thứ ${i + 1}/${maxPosts}`, i + 1, maxPosts);
        
        await sleep(500);
        const success = await doLike(wantLike);
        
        const msg = success ? `${wantLike ? 'Đã thả tim' : 'Đã bỏ tim'} video ${i + 1}` : `Đã bỏ qua video ${i + 1}`;
        addFloatingLog(msg, success ? 'success' : 'error');
        
        sendProgress('likeProgress', {
          current: i + 1,
          total: maxPosts,
          message: msg,
          success
        });
        
        // Save progress
        await chrome.storage.local.set({ pendingTask: { ...task, processed: i + 1 } });
        
        // Move to next video if not done
        if (i + 1 < maxPosts) {
          await nextVideo();
          await sleep(randomDelay(delayMin, delayMax));
        }
      }
      
    } else {
      // User list mode with postsPerUser support
      const users = userList || [];
      const totalUsers = Math.min(users.length, maxPosts);
      let userIndex = Math.floor(processed / postsPerUser);
      let postIndex = processed % postsPerUser;
      
      // Hàm kiểm tra xem trang có video hay không
      const checkHasVideos = () => {
        const selectors = [
          'div[data-e2e="user-post-item"]',
          'div[data-e2e="user-post-item-list"] > div',
          '[class*="DivItemContainerV2"]',
          '[class*="DivItemContainer"]',
          'a[href*="/video/"]'
        ];
        for (const sel of selectors) {
          if (document.querySelector(sel)) return true;
        }
        return false;
      };
      
      while (userIndex < totalUsers) {
        
        if (await shouldStop()) {
          console.log('Auto Tiktok: *** STOPPED BY USER ***');
          sendProgress('likeComplete', {});
          removeFloatingPopup();
          return;
        }
        
        const user = users[userIndex].replace('@', '');
        console.log('Auto Tiktok: Processing user', user, 'post', postIndex + 1, 'of', postsPerUser);
        
        // Navigate to user profile if needed
        if (!location.href.includes(`/@${user}`)) {
          await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser + postIndex } });
          location.href = withLangEn(`https://www.tiktok.com/@${user}`);
          return;
        }
        
        // Chờ trang load xong
        await sleep(2000);
        
        // Kiểm tra xem trang có video hay không trước khi thử click
        if (!checkHasVideos()) {
          const msg = `Bỏ qua @${user} (không có video)`;
          addFloatingLog(msg, 'error');
          sendProgress('likeProgress', { current: userIndex + 1, total: totalUsers, message: msg, success: false });
          userIndex++;
          postIndex = 0;
          if (userIndex < totalUsers) {
            await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser } });
            await sleep(randomDelay(delayMin, delayMax));
            location.href = withLangEn(`https://www.tiktok.com/@${users[userIndex].replace('@', '')}`);
            return;
          }
          continue;
        }
        
        // Click first video if modal not open
        if (!isVideoModalOpen()) {
          await sleep(2000);
          if (!await clickFirstVideo()) {
            const msg = `Bỏ qua @${user} (không mở được video)`;
            addFloatingLog(msg, 'error');
            sendProgress('likeProgress', { current: userIndex + 1, total: totalUsers, message: msg, success: false });
            // Navigate to next user
            userIndex++;
            postIndex = 0;
            if (userIndex < totalUsers) {
              await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser } });
              location.href = withLangEn(`https://www.tiktok.com/@${users[userIndex].replace('@', '')}`);
              return;
            }
            continue;
          }
          await waitForVideoModal();
        }
        
        await sleep(500);
        await doLike(wantLike);
        
        const msg = `${wantLike ? 'Đã thả tim' : 'Đã bỏ tim'} @${user} (${postIndex + 1}/${postsPerUser})`;
        addFloatingLog(msg, 'success');
        updateFloatingPopup(msg, userIndex * postsPerUser + postIndex + 1, totalUsers * postsPerUser);
        
        sendProgress('likeProgress', {
          current: userIndex + 1,
          total: totalUsers,
          message: msg,
          success: true
        });
        
        postIndex++;
        
        // Check if we need more posts from this user
        if (postIndex < postsPerUser) {
          await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser + postIndex } });
          await nextVideo();
          await sleep(randomDelay(delayMin, delayMax));
        } else {
          // Move to next user
          await closeModal();
          userIndex++;
          postIndex = 0;
          
          if (userIndex < totalUsers) {
            await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser } });
            await sleep(randomDelay(delayMin, delayMax));
            location.href = withLangEn(`https://www.tiktok.com/@${users[userIndex].replace('@', '')}`);
            return;
          }
        }
      }
    }
    
    console.log('Auto Tiktok: Auto like complete!');
    await chrome.storage.local.remove(['pendingTask']);
    sendProgress('likeComplete', {});
    updateFloatingPopup('Hoàn tất!', maxPosts, maxPosts);
    setTimeout(() => removeFloatingPopup(), 3000);
  }
  
  async function runAutoComment(task) {
    const { targetType, hashtag, userList, comments, maxPosts, delayMin, delayMax, alsoLike } = task;
    const postsPerUser = task.postsPerUser || 1;
    let processed = task.processed || 0;
    
    console.log('Auto Tiktok: === runAutoComment ===', 'postsPerUser:', postsPerUser);
    
    // Show floating popup
    createFloatingPopup();
    updateFloatingPopup('Bắt đầu tự động bình luận...', 0, maxPosts);
    
    if (!comments || comments.length === 0) {
      sendProgress('error', { message: 'Chưa có bình luận nào được cung cấp' });
      sendProgress('commentComplete', {});
      await chrome.storage.local.remove(['pendingTask']);
      removeFloatingPopup();
      return;
    }
    
    if (!await waitPageReady()) {
      removeFloatingPopup();
      return;
    }
    
    if (targetType === 'hashtag') {
      const tag = hashtag.replace('#', '');
      
      if (!location.href.includes(`/tag/${tag}`)) {
        await chrome.storage.local.set({ pendingTask: { ...task, processed } });
        location.href = withLangEn(`https://www.tiktok.com/tag/${tag}`);
        return;
      }
      
      if (!isVideoModalOpen()) {
        await sleep(2000);
        if (!await clickFirstVideo() || !await waitForVideoModal()) {
          sendProgress('error', { message: 'Không thể mở video' });
          sendProgress('commentComplete', {});
          await chrome.storage.local.remove(['pendingTask']);
          removeFloatingPopup();
          return;
        }
      }
      
      await sleep(1000);
      
      for (let i = processed; i < maxPosts; i++) {
        
        
        if (await shouldStop()) {
          sendProgress('commentComplete', {});
          removeFloatingPopup();
          return;
        }
        
        console.log('Auto Tiktok: === Processing video', i + 1, 'of', maxPosts, '===');
        updateFloatingPopup(`Video thứ ${i + 1}/${maxPosts}`, i + 1, maxPosts);
        
        if (alsoLike) {
          await doLike(true);
          await sleep(800);
        }
        
        const success = await doComment(comments);
        console.log('Auto Tiktok: doComment returned:', success);
        
        const msg = success ? `Đã bình luận video ${i + 1}` : `Thất bại ở video ${i + 1}`;
        addFloatingLog(msg, success ? 'success' : 'error');
        
        sendProgress('commentProgress', {
          current: i + 1,
          total: maxPosts,
          message: msg,
          success
        });
        
        await chrome.storage.local.set({ pendingTask: { ...task, processed: i + 1 } });
        
        // ALWAYS go to next video, regardless of success
        if (i + 1 < maxPosts) {
          console.log('Auto Tiktok: Going to next video...');
          await nextVideo();
          console.log('Auto Tiktok: nextVideo done, waiting...');
          await sleep(randomDelay(delayMin, delayMax));
        }
      }
      
    } else {
      // User list mode with postsPerUser support
      const users = userList || [];
      const totalUsers = Math.min(users.length, maxPosts);
      let userIndex = Math.floor(processed / postsPerUser);
      let postIndex = processed % postsPerUser;
      
      // Hàm kiểm tra xem trang có video hay không
      const checkHasVideos = () => {
        const selectors = [
          'div[data-e2e="user-post-item"]',
          'div[data-e2e="user-post-item-list"] > div',
          '[class*="DivItemContainerV2"]',
          '[class*="DivItemContainer"]',
          'a[href*="/video/"]'
        ];
        for (const sel of selectors) {
          if (document.querySelector(sel)) return true;
        }
        return false;
      };
      
      while (userIndex < totalUsers) {
        
        if (await shouldStop()) {
          sendProgress('commentComplete', {});
          removeFloatingPopup();
          return;
        }
        
        const user = users[userIndex].replace('@', '');
        console.log('Auto Tiktok: Processing user', user, 'post', postIndex + 1, 'of', postsPerUser);
        
        if (!location.href.includes(`/@${user}`)) {
          await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser + postIndex } });
          location.href = withLangEn(`https://www.tiktok.com/@${user}`);
          return;
        }
        
        // Chờ trang load xong
        await sleep(2000);
        
        // Kiểm tra xem trang có video hay không trước khi thử click
        if (!checkHasVideos()) {
          const msg = `Bỏ qua @${user} (không có video)`;
          addFloatingLog(msg, 'error');
          sendProgress('commentProgress', { current: userIndex + 1, total: totalUsers, message: msg, success: false });
          userIndex++;
          postIndex = 0;
          if (userIndex < totalUsers) {
            await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser } });
            location.href = withLangEn(`https://www.tiktok.com/@${users[userIndex].replace('@', '')}`);
            return;
          }
          continue;
        }
        
        if (!isVideoModalOpen()) {
          await sleep(2000);
          if (!await clickFirstVideo() || !await waitForVideoModal()) {
            const msg = `Bỏ qua @${user} (không mở được video)`;
            addFloatingLog(msg, 'error');
            sendProgress('commentProgress', { current: userIndex + 1, total: totalUsers, message: msg, success: false });
            userIndex++;
            postIndex = 0;
            if (userIndex < totalUsers) {
              await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser } });
              location.href = withLangEn(`https://www.tiktok.com/@${users[userIndex].replace('@', '')}`);
              return;
            }
            continue;
          }
        }
        
        await sleep(1000);
        updateFloatingPopup(`@${user} (${postIndex + 1}/${postsPerUser})`, userIndex * postsPerUser + postIndex + 1, totalUsers * postsPerUser);
        
        if (alsoLike) {
          await doLike(true);
          await sleep(800);
        }
        
        const success = await doComment(comments);
        const msg = success ? `Đã bình luận @${user} (${postIndex + 1}/${postsPerUser})` : `Thất bại @${user}`;
        addFloatingLog(msg, success ? 'success' : 'error');
        
        sendProgress('commentProgress', {
          current: userIndex + 1,
          total: totalUsers,
          message: msg,
          success
        });
        
        postIndex++;
        
        // Check if we need more posts from this user
        if (postIndex < postsPerUser) {
          await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser + postIndex } });
          await nextVideo();
          await sleep(randomDelay(delayMin, delayMax));
        } else {
          // Move to next user
          await closeModal();
          userIndex++;
          postIndex = 0;
          
          if (userIndex < totalUsers) {
            await chrome.storage.local.set({ pendingTask: { ...task, processed: userIndex * postsPerUser } });
            await sleep(randomDelay(delayMin, delayMax));
            location.href = withLangEn(`https://www.tiktok.com/@${users[userIndex].replace('@', '')}`);
            return;
          }
        }
      }
    }
    
    await chrome.storage.local.remove(['pendingTask']);
    sendProgress('commentComplete', {});
    updateFloatingPopup('Hoàn tất!', maxPosts, maxPosts);
    setTimeout(() => removeFloatingPopup(), 3000);
  }
  
  async function runExtraction(task) {
    const { extractType, target, maxUsers } = task;
    const type = extractType;
    const input = target;
    
    console.log('Auto Tiktok: === runExtraction ===', type, input);
    
    if (!await waitPageReady()) return;
    
    if (type === 'followers' || type === 'followings') {
      const user = input.replace('@', '');
      
      if (!location.href.includes(`/@${user}`)) {
        await chrome.storage.local.set({ pendingTask: task });
        location.href = withLangEn(`https://www.tiktok.com/@${user}`);
        return;
      }
      
      await sleep(2000);
      
      // Click on followers or following count to open popup
      const selector = type === 'followers' ? '[data-e2e="followers-count"]' : '[data-e2e="following-count"]';
      const countEl = document.querySelector(selector);
      if (countEl) {
        const clickTarget = countEl.closest('a') || countEl.parentElement || countEl;
        console.log('Auto Tiktok: Clicking on', type, 'count');
        await click(clickTarget);
        await sleep(2000);
      } else {
        console.log('Auto Tiktok: Count element not found, trying alternative');
        // Try clicking on the strong element with count
        const strongEls = document.querySelectorAll('strong[data-e2e]');
        for (const el of strongEls) {
          if (el.dataset.e2e.includes(type.slice(0, -1))) { // follower or following
            await click(el.parentElement);
            await sleep(2000);
            break;
          }
        }
      }
      
      // Wait for popup to appear
      let popup = null;
      for (let i = 0; i < 10; i++) {
        popup = document.querySelector('[data-e2e="follow-info-popup"]');
        if (popup) break;
        await sleep(500);
      }
      
      if (!popup) {
        console.log('Auto Tiktok: Popup not found');
        sendProgress('error', { message: 'Không thể mở danh sách follower/following' });
        sendProgress('extractionComplete', {});
        await chrome.storage.local.remove(['pendingTask']);
        return;
      }
      
      console.log('Auto Tiktok: Popup found, starting extraction');
      
      // Click on the correct tab (Followers or Following)
      const tabs = popup.querySelectorAll('div[class*="DivTabItem"]');
      for (const tab of tabs) {
        const tabText = tab.textContent.toLowerCase();
        if ((type === 'followers' && tabText.includes('follower')) ||
            (type === 'followings' && tabText.includes('following'))) {
          await click(tab);
          await sleep(1000);
          break;
        }
      }
      
      // Find scrollable container
      const scrollContainer = popup.querySelector('div[class*="DivUserListContainer"]');
      
      const extracted = new Set();
      let noNewCount = 0;
      let lastCount = 0;
      
      while (extracted.size < maxUsers) {
        if (await shouldStop()) break;
        
        // Extract usernames from the popup - look for the unique ID paragraph
        const userElements = popup.querySelectorAll('p[class*="PUniqueId"]');
        
        userElements.forEach(el => {
          const username = el.textContent?.trim();
          if (username && !extracted.has(username)) {
            extracted.add(username);
            sendProgress('userExtracted', { username });
            console.log('Auto Tiktok: Extracted:', username);
          }
        });
        
        // Check if we got new users
        if (extracted.size === lastCount) {
          noNewCount++;
          if (noNewCount > 15) {
            console.log('Auto Tiktok: No new users found, stopping');
            break;
          }
        } else {
          noNewCount = 0;
          lastCount = extracted.size;
        }
        
        // Scroll the container
        if (scrollContainer) {
          scrollContainer.scrollTop += 500;
        } else {
          // Try scrolling the popup itself
          popup.scrollTop += 500;
        }
        
        await sleep(800);
      }
      
      console.log('Auto Tiktok: Extraction complete, total:', extracted.size);
      
    } else if (type === 'hashtag') {
      const tag = input.replace('#', '');
      
      if (!location.href.includes(`/tag/${tag}`)) {
        await chrome.storage.local.set({ pendingTask: task });
        location.href = withLangEn(`https://www.tiktok.com/tag/${tag}`);
        return;
      }
      
      if (!isVideoModalOpen()) {
        await sleep(2000);
        if (!await clickFirstVideo() || !await waitForVideoModal()) {
          sendProgress('error', { message: 'Không tìm thấy video' });
          sendProgress('extractionComplete', {});
          await chrome.storage.local.remove(['pendingTask']);
          return;
        }
      }
      
      const extracted = new Set();
      
      while (extracted.size < maxUsers) {
        if (await shouldStop()) break;
        
        const el = document.querySelector('[data-e2e="browse-username"]');
        if (el) {
          const u = el.textContent?.trim().replace('@', '');
          if (u && !extracted.has(u)) {
            extracted.add(u);
            sendProgress('userExtracted', { username: u });
          }
        }
        
        await nextVideo();
        await sleep(1500);
      }
      
    } else if (type === 'commenters') {
      if (!location.href.includes('/video/') && !isVideoModalOpen()) {
        await chrome.storage.local.set({ pendingTask: task });
        location.href = withLangEn(input);
        return;
      }
      
      await sleep(3000);
      const extracted = new Set();
      let noNew = 0, last = 0;
      
      while (extracted.size < maxUsers) {
        if (await shouldStop()) break;
        
        document.querySelectorAll('[data-e2e*="comment-username"], a[href^="/@"]').forEach(el => {
          let u = el.textContent?.trim().replace('@', '');
          if (!u && el.href) {
            const m = el.href.match(/@([^/?]+)/);
            if (m) u = m[1];
          }
          if (u && !extracted.has(u)) {
            extracted.add(u);
            sendProgress('userExtracted', { username: u });
          }
        });
        
        if (extracted.size === last) {
          if (++noNew > 6) break;
        } else {
          noNew = 0;
          last = extracted.size;
        }
        
        window.scrollBy(0, 400);
        await sleep(1500);
      }
    }
    
    await chrome.storage.local.remove(['pendingTask']);
    sendProgress('extractionComplete', {});
  }
  
  // ============ BULK FOLLOW ============
  
  async function runBulkFollow(task) {
    const { followAction, userList, maxUsers, delayMin, delayMax } = task;
    let processed = task.processed || 0;
    const wantFollow = followAction === 'follow';
    
    console.log('Auto Tiktok: === runBulkFollow ===', followAction, 'processed:', processed, 'max:', maxUsers);
    
    createFloatingPopup();
    updateFloatingPopup(`Bắt đầu ${wantFollow ? 'theo dõi' : 'hủy theo dõi'} hàng loạt...`, 0, maxUsers);
    
    if (!await waitPageReady()) {
      removeFloatingPopup();
      return;
    }
    
    const users = userList || [];
    const total = Math.min(users.length, maxUsers);
    
    // Start from processed index
    const i = processed;
    
    // Check if we've completed all users
    if (i >= total) {
      console.log('Auto Tiktok: Bulk follow complete!');
      await chrome.storage.local.remove(['pendingTask']);
      sendProgress('followComplete', {});
      removeFloatingPopup();
      return;
    }
    
    
    if (await shouldStop()) {
      console.log('Auto Tiktok: *** STOPPED BY USER ***');
      sendProgress('followComplete', {});
      removeFloatingPopup();
      return;
    }
    
    const user = users[i].replace('@', '');
    console.log('Auto Tiktok: Processing user', i + 1, ':', user);
    updateFloatingPopup(`@${user} (${i + 1}/${total})`, i + 1, total);
    
    // Navigate to user profile if needed
    if (!location.href.includes(`/@${user}`)) {
      console.log('Auto Tiktok: Navigating to user profile:', user);
      await chrome.storage.local.set({ pendingTask: { ...task, processed: i } });
      location.href = withLangEn(`https://www.tiktok.com/@${user}`);
      return;
    }
    
    await sleep(2000);
    
    // Find follow button
    const followBtn = document.querySelector('button[data-e2e="follow-button"]');
    
    if (!followBtn) {
      const msg = `Không tìm thấy nút @${user}`;
      addFloatingLog(msg, 'error');
      sendProgress('followProgress', { current: i + 1, total, message: msg, success: false });
    } else {
      // Check current state - TUXButton--primary means not following, TUXButton--secondary means following
      const isPrimary = followBtn.classList.contains('TUXButton--primary');
      const isFollowing = !isPrimary; // secondary = already following
      
      let success = false;
      let msg = '';
      
      if (wantFollow && !isFollowing) {
        // Want to follow and not currently following
        followBtn.click();
        await sleep(1500);
        msg = `Đã theo dõi @${user}`;
        success = true;
      } else if (!wantFollow && isFollowing) {
        // Want to unfollow and currently following
        followBtn.click();
        await sleep(1500);
        msg = `Đã hủy theo dõi @${user}`;
        success = true;
      } else {
        msg = wantFollow ? `Đã theo dõi sẵn @${user}` : `Hiện chưa theo dõi @${user}`;
        success = true;
      }
      
      addFloatingLog(msg, success ? 'success' : 'error');
      sendProgress('followProgress', { current: i + 1, total, message: msg, success });
    }
    
    // Move to next user
    if (i + 1 < total) {
      console.log('Auto Tiktok: Moving to next user...');
      await chrome.storage.local.set({ pendingTask: { ...task, processed: i + 1 } });
      await sleep(randomDelay(delayMin, delayMax));
      const nextUser = users[i + 1].replace('@', '');
      location.href = withLangEn(`https://www.tiktok.com/@${nextUser}`);
      return;
    }
    
    // All done
    console.log('Auto Tiktok: Bulk follow complete!');
    await chrome.storage.local.remove(['pendingTask']);
    sendProgress('followComplete', {});
    removeFloatingPopup();
  }
  
  // ============ MAIN ============
  
  async function main() {
    const { pendingTask } = await chrome.storage.local.get(['pendingTask']);
    
    if (!pendingTask) {
      console.log('Auto Tiktok: No pending task');
      return;
    }
    
    console.log('Auto Tiktok: Starting task:', pendingTask.action);
    window.TIKTOK_BOT_STOP = false;
    
    try {
      void initMusicDownloadFeature().catch(() => {});

      if (pendingTask.action === 'startAutoLike') {
        await runAutoLike(pendingTask);
      } else if (pendingTask.action === 'startAutoComment') {
        await runAutoComment(pendingTask);
      } else if (pendingTask.action === 'startExtraction') {
        await runExtraction(pendingTask);
      } else if (pendingTask.action === 'startBulkFollow') {
        await runBulkFollow(pendingTask);
      }
    } catch (e) {
      console.error('Auto Tiktok: Error:', e);
      sendProgress('error', { message: e.message });
      await chrome.storage.local.remove(['pendingTask']);
    }
  }
  
  // Start after page loads
  if (document.readyState === 'complete') {
    void initMusicDownloadFeature().catch(() => {});
    setTimeout(main, 2500);
  } else {
    window.addEventListener('load', () => {
      void initMusicDownloadFeature().catch(() => {});
      setTimeout(main, 2500);
    });
  }
})();
