// State Management
const state = {
  extractedUsers: [],
  userList: [],
  comments: [],
  isRunning: false,
  currentTask: null
};

const CONFIG = window.APP_CONFIG || {
  IS_PREMIUM: false,
  LIMITS: { maxLikes: 10000, maxComments: 10000, maxFollow: 10000, runtimeFreeLimit: 10000 },
};

// Helper: add ?lang=en to TikTok URLs
function withLangEn(url) {
  try {
    const u = new URL(url);
    u.searchParams.set('lang', 'en');
    return u.toString();
  } catch {
    const [base, hash] = String(url).split('#');
    const sep = base.includes('?') ? '&' : '?';
    const out = base.includes('lang=') ? base.replace(/([?&])lang=[^&]*/, '$1lang=en') : (base + sep + 'lang=en');
    return hash ? out + '#' + hash : out;
  }
}

// DOM Elements
const elements = {
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  statusIndicator: document.getElementById('statusIndicator'),
  
  // Extractor
  extractTypeRadios: document.querySelectorAll('input[name="extractType"]'),
  extractInput: document.getElementById('extractInput'),
  extractInputLabel: document.getElementById('extractInputLabel'),
  maxExtract: document.getElementById('maxExtract'),
  startExtractBtn: document.getElementById('startExtract'),
  stopExtractBtn: document.getElementById('stopExtract'),
  extractedList: document.getElementById('extractedList'),
  extractCounter: document.getElementById('extractCounter'),
  copyExtractedBtn: document.getElementById('copyExtracted'),
  exportExtractedBtn: document.getElementById('exportExtracted'),
  sendToListBtn: document.getElementById('sendToList'),
  clearExtractedBtn: document.getElementById('clearExtracted'),
  
  // Auto Like
  likeTargetRadios: document.querySelectorAll('input[name="likeTarget"]'),
  hashtagInputGroup: document.getElementById('hashtagInputGroup'),
  likeHashtag: document.getElementById('likeHashtag'),
  likeActionRadios: document.querySelectorAll('input[name="likeAction"]'),
  maxLikes: document.getElementById('maxLikes'),
  likeDelayMin: document.getElementById('likeDelayMin'),
  likeDelayMax: document.getElementById('likeDelayMax'),
  startLikeBtn: document.getElementById('startLike'),
  stopLikeBtn: document.getElementById('stopLike'),
  likeProgressText: document.getElementById('likeProgressText'),
  likeProgressFill: document.getElementById('likeProgressFill'),
  likeLog: document.getElementById('likeLog'),
  
  // Auto Comment
  commentTargetRadios: document.querySelectorAll('input[name="commentTarget"]'),
  commentHashtagGroup: document.getElementById('commentHashtagGroup'),
  commentHashtag: document.getElementById('commentHashtag'),
  newComment: document.getElementById('newComment'),
  addCommentBtn: document.getElementById('addComment'),
  commentsList: document.getElementById('commentsList'),
  importCommentsBtn: document.getElementById('importComments'),
  clearCommentsBtn: document.getElementById('clearComments'),
  commentsFile: document.getElementById('commentsFile'),
  alsoLike: document.getElementById('alsoLike'),
  maxComments: document.getElementById('maxComments'),
  commentDelayMin: document.getElementById('commentDelayMin'),
  commentDelayMax: document.getElementById('commentDelayMax'),
  startCommentBtn: document.getElementById('startComment'),
  stopCommentBtn: document.getElementById('stopComment'),
  commentProgressText: document.getElementById('commentProgressText'),
  commentProgressFill: document.getElementById('commentProgressFill'),
  commentLog: document.getElementById('commentLog'),
  
  // Bulk Follow
  followActionRadios: document.querySelectorAll('input[name="followAction"]'),
  maxFollow: document.getElementById('maxFollow'),
  followDelayMin: document.getElementById('followDelayMin'),
  followDelayMax: document.getElementById('followDelayMax'),
  followUserCount: document.getElementById('followUserCount'),
  startFollowBtn: document.getElementById('startFollow'),
  stopFollowBtn: document.getElementById('stopFollow'),
  followProgressText: document.getElementById('followProgressText'),
  followProgressFill: document.getElementById('followProgressFill'),
  followLog: document.getElementById('followLog'),
  
  // User List
  manualUser: document.getElementById('manualUser'),
  addUserBtn: document.getElementById('addUser'),
  importUsersBtn: document.getElementById('importUsers'),
  usersFile: document.getElementById('usersFile'),
  userListDisplay: document.getElementById('userListDisplay'),
  userListCounter: document.getElementById('userListCounter'),
  copyUserListBtn: document.getElementById('copyUserList'),
  exportUserListBtn: document.getElementById('exportUserList'),
  clearUserListBtn: document.getElementById('clearUserList'),
  
  // Limit badges
  likeLimitBadge: document.getElementById('likeLimitBadge'),
  commentLimitBadge: document.getElementById('commentLimitBadge'),
  followLimitBadge: document.getElementById('followLimitBadge')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  setupEventListeners();
  updateUI();
  await checkRunningTask();
  await ensureTikTokOpen();
});

// Ensure TikTok is open with ?lang=en
async function ensureTikTokOpen() {
  try {
    const tabs = await chrome.tabs.query({ url: ['*://www.tiktok.com/*', '*://tiktok.com/*'] });
    
    if (tabs.length === 0) {
      chrome.tabs.create({ url: 'https://www.tiktok.com/?lang=en' });
      return;
    }
    
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab && currentTab.url && currentTab.url.includes('tiktok.com')) {
      const url = new URL(currentTab.url);
      if (url.searchParams.get('lang') !== 'en') {
        url.searchParams.set('lang', 'en');
        await chrome.tabs.update(currentTab.id, { url: url.toString() });
      }
    }
  } catch (e) {
    console.log('Could not ensure TikTok open:', e);
  }
}

// Check running task
async function checkRunningTask() {
  const { pendingTask } = await chrome.storage.local.get(['pendingTask']);
  if (pendingTask) {
    let taskType = null;
    if (pendingTask.action === 'startAutoLike') taskType = 'like';
    else if (pendingTask.action === 'startAutoComment') taskType = 'comment';
    else if (pendingTask.action === 'startExtraction') taskType = 'extract';
    else if (pendingTask.action === 'startBulkFollow') taskType = 'follow';
    setRunningState(true, taskType);
  }
}

// Load state
async function loadState() {
  const result = await chrome.storage.local.get(['extractedUsers', 'userList', 'comments']);
  if (result.extractedUsers) state.extractedUsers = result.extractedUsers;
  if (result.userList) state.userList = result.userList;
  if (result.comments) state.comments = result.comments;
}

// Save state
function saveState() {
  chrome.storage.local.set({
    extractedUsers: state.extractedUsers,
    userList: state.userList,
    comments: state.comments
  });
}



// Check limit (configured)
function checkLimit(inputElement) {
  const value = parseInt(inputElement.value);
  const limitMap = {
    maxLikes: CONFIG.LIMITS.maxLikes,
    maxComments: CONFIG.LIMITS.maxComments,
    maxFollow: CONFIG.LIMITS.maxFollow
  };
  const limit = Number(limitMap[inputElement.id] || 10000);
  if (value > limit) {
    inputElement.value = limit;
    showToast(`Giới hạn hiện tại là ${limit}`, 'error');
    return false;
  }
  return true;
}

// Setup listeners
function setupEventListeners() {
  elements.tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  
  // Extractor
  elements.extractTypeRadios.forEach(radio => radio.addEventListener('change', updateExtractorUI));
  elements.startExtractBtn.addEventListener('click', startExtraction);
  elements.stopExtractBtn.addEventListener('click', stopTask);
  elements.copyExtractedBtn.addEventListener('click', () => copyToClipboard(state.extractedUsers));
  elements.exportExtractedBtn.addEventListener('click', () => exportToFile(state.extractedUsers, 'extracted_users.txt'));
  elements.sendToListBtn.addEventListener('click', sendExtractedToList);
  elements.clearExtractedBtn.addEventListener('click', clearExtracted);
  
  // Auto Like
  elements.likeTargetRadios.forEach(radio => radio.addEventListener('change', updateLikeUI));
  elements.startLikeBtn.addEventListener('click', startAutoLike);
  elements.stopLikeBtn.addEventListener('click', stopTask);
  
  // Auto Comment
  elements.commentTargetRadios.forEach(radio => radio.addEventListener('change', updateCommentUI));
  elements.addCommentBtn.addEventListener('click', addComment);
  elements.importCommentsBtn.addEventListener('click', () => elements.commentsFile.click());
  elements.commentsFile.addEventListener('change', importComments);
  elements.clearCommentsBtn.addEventListener('click', clearComments);
  elements.startCommentBtn.addEventListener('click', startAutoComment);
  elements.stopCommentBtn.addEventListener('click', stopTask);
  
  // Bulk Follow
  elements.startFollowBtn.addEventListener('click', startBulkFollow);
  elements.stopFollowBtn.addEventListener('click', stopTask);
  
  // User List
  elements.addUserBtn.addEventListener('click', addManualUser);
  elements.manualUser.addEventListener('keypress', (e) => { if (e.key === 'Enter') addManualUser(); });
  elements.importUsersBtn.addEventListener('click', () => elements.usersFile.click());
  elements.usersFile.addEventListener('change', importUsers);
  elements.copyUserListBtn.addEventListener('click', () => copyToClipboard(state.userList));
  elements.exportUserListBtn.addEventListener('click', () => exportToFile(state.userList, 'user_list.txt'));
  elements.clearUserListBtn.addEventListener('click', clearUserList);
  
  // Apri in finestra separata
  document.getElementById('btnOpenWindow').addEventListener('click', () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 450,
      height: 650
    });
    window.close();
  });
  
  // Limited inputs
  document.querySelectorAll('.limited-input').forEach(input => {
    input.addEventListener('change', () => {
      const limitMap = {
        maxLikes: CONFIG.LIMITS.maxLikes,
        maxComments: CONFIG.LIMITS.maxComments,
        maxFollow: CONFIG.LIMITS.maxFollow
      };
      const limit = Number(limitMap[input.id] || 10000);
      if (parseInt(input.value) > limit) {
        input.value = String(limit);
        showToast(`Giới hạn hiện tại là ${limit}`, 'error');
      }
      if (parseInt(input.value) < 1 || Number.isNaN(parseInt(input.value))) {
        input.value = '1';
      }
    });
  });
  
  chrome.runtime.onMessage.addListener((message) => handleContentMessage(message));
}

// Tab switch
function switchTab(tabId) {
  elements.tabs.forEach(tab => {
    const active = tab.dataset.tab === tabId;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  elements.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
  if (tabId === 'bulkfollow') elements.followUserCount.textContent = state.userList.length;
}

// UI updates
function updateExtractorUI() {
  const type = document.querySelector('input[name="extractType"]:checked').value;
  const labels = { followers: 'Tên người dùng', followings: 'Tên người dùng', hashtag: 'Hashtag', commenters: 'URL bài viết' };
  const placeholders = { followers: 'tên người dùng', followings: 'tên người dùng', hashtag: 'hashtag', commenters: 'URL bài viết' };
  const hints = {
    followers: 'Nhập username profile cần lấy danh sách người theo dõi.',
    followings: 'Nhập username profile cần lấy danh sách đang theo dõi.',
    hashtag: 'Nhập tên hashtag (không cần dấu #).',
    commenters: 'Dán URL đầy đủ của bài đăng để lấy người bình luận.'
  };
  elements.extractInputLabel.textContent = labels[type];
  elements.extractInput.placeholder = `Nhập ${placeholders[type]}`;
  const hintEl = document.getElementById('extractHint');
  if (hintEl) hintEl.textContent = hints[type] || '';
}

function updateLikeUI() {
  const target = document.querySelector('input[name="likeTarget"]:checked').value;
  elements.hashtagInputGroup.style.display = target === 'hashtag' ? 'block' : 'none';
  document.getElementById('postsPerUserLikeGroup').style.display = target === 'userlist' ? 'block' : 'none';
}

function updateCommentUI() {
  const target = document.querySelector('input[name="commentTarget"]:checked').value;
  elements.commentHashtagGroup.style.display = target === 'hashtag' ? 'block' : 'none';
  document.getElementById('postsPerUserCommentGroup').style.display = target === 'userlist' ? 'block' : 'none';
}

function updateUI() {
  updateExtractorUI();
  updateExtractedList();
  updateUserList();
  updateCommentsList();
  elements.followUserCount.textContent = state.userList.length;
}

function updateExtractedList() {
  elements.extractedList.innerHTML = state.extractedUsers.map((user, i) => 
    `<div class="user-item"><span class="username">@${user}</span><button class="delete-btn" data-index="${i}">×</button></div>`
  ).join('');
  elements.extractCounter.textContent = state.extractedUsers.length;
  elements.extractedList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.extractedUsers.splice(parseInt(e.target.dataset.index), 1);
      saveState();
      updateExtractedList();
    });
  });
}

function updateUserList() {
  elements.userListDisplay.innerHTML = state.userList.map((user, i) => 
    `<div class="user-item"><span class="username">@${user}</span><button class="delete-btn" data-index="${i}">×</button></div>`
  ).join('');
  elements.userListCounter.textContent = state.userList.length;
  elements.followUserCount.textContent = state.userList.length;
  elements.userListDisplay.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.userList.splice(parseInt(e.target.dataset.index), 1);
      saveState();
      updateUserList();
    });
  });
}

function updateCommentsList() {
  elements.commentsList.innerHTML = state.comments.map((c, i) => 
    `<div class="comment-item"><span>${c.length > 40 ? c.substring(0, 40) + '...' : c}</span><button class="delete-btn" data-index="${i}">×</button></div>`
  ).join('');
  elements.commentsList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.comments.splice(parseInt(e.target.dataset.index), 1);
      saveState();
      updateCommentsList();
    });
  });
}

// Tasks
async function startExtraction() {
  const type = document.querySelector('input[name="extractType"]:checked').value;
  const input = elements.extractInput.value.trim();
  if (!input) { showToast('Vui lòng nhập giá trị', 'error'); return; }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('tiktok.com')) { showToast('Vui lòng mở TikTok trước', 'error'); return; }
  
  setRunningState(true, 'extract');
  state.extractedUsers = [];
  updateExtractedList();
  
  const task = { action: 'startExtraction', extractType: type, target: input, maxUsers: parseInt(elements.maxExtract.value), processed: 0 };
  await chrome.storage.local.set({ pendingTask: task });
  
  let url = null;
  if (type === 'followers' || type === 'followings') url = withLangEn(`https://www.tiktok.com/@${input.replace('@', '')}`);
  else if (type === 'hashtag') url = withLangEn(`https://www.tiktok.com/tag/${input.replace('#', '')}`);
  else if (type === 'commenters') url = withLangEn(input);
  if (url) chrome.tabs.update(tab.id, { url });
  showToast('Bắt đầu quét...', 'success');
}

async function startAutoLike() {
  if (!checkLimit(elements.maxLikes)) return;
  const targetType = document.querySelector('input[name="likeTarget"]:checked').value;
  const action = document.querySelector('input[name="likeAction"]:checked').value;
  
  if (targetType === 'hashtag' && !elements.likeHashtag.value.trim()) { showToast('Vui lòng nhập hashtag', 'error'); return; }
  if (targetType === 'userlist' && state.userList.length === 0) { showToast('Danh sách người dùng đang trống', 'error'); return; }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('tiktok.com')) { showToast('Vui lòng mở TikTok trước', 'error'); return; }
  
  setRunningState(true, 'like');
  clearLog('like');
  
  const task = {
    action: 'startAutoLike', targetType, likeAction: action,
    hashtag: elements.likeHashtag.value.trim(), userList: state.userList,
    maxPosts: parseInt(elements.maxLikes.value),
    postsPerUser: parseInt(document.getElementById('postsPerUserLike').value) || 1,
    delayMin: parseInt(elements.likeDelayMin.value) * 1000,
    delayMax: parseInt(elements.likeDelayMax.value) * 1000, processed: 0,
    freeLimit: CONFIG.LIMITS.runtimeFreeLimit
  };
  await chrome.storage.local.set({ pendingTask: task });
  
  let url = targetType === 'hashtag' ? withLangEn(`https://www.tiktok.com/tag/${task.hashtag.replace('#', '')}`) : withLangEn(`https://www.tiktok.com/@${state.userList[0].replace('@', '')}`);
  chrome.tabs.update(tab.id, { url });
  showToast('Bắt đầu tự động like...', 'success');
}

async function startAutoComment() {
  if (!checkLimit(elements.maxComments)) return;
  if (state.comments.length === 0) { showToast('Vui lòng thêm ít nhất một bình luận', 'error'); return; }
  
  const targetType = document.querySelector('input[name="commentTarget"]:checked').value;
  if (targetType === 'hashtag' && !elements.commentHashtag.value.trim()) { showToast('Vui lòng nhập hashtag', 'error'); return; }
  if (targetType === 'userlist' && state.userList.length === 0) { showToast('Danh sách người dùng đang trống', 'error'); return; }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('tiktok.com')) { showToast('Vui lòng mở TikTok trước', 'error'); return; }
  
  setRunningState(true, 'comment');
  clearLog('comment');
  
  const task = {
    action: 'startAutoComment', targetType,
    hashtag: elements.commentHashtag.value.trim(), userList: state.userList, comments: state.comments,
    maxPosts: parseInt(elements.maxComments.value),
    postsPerUser: parseInt(document.getElementById('postsPerUserComment').value) || 1,
    delayMin: parseInt(elements.commentDelayMin.value) * 1000,
    delayMax: parseInt(elements.commentDelayMax.value) * 1000,
    alsoLike: elements.alsoLike.checked, processed: 0,
    freeLimit: CONFIG.LIMITS.runtimeFreeLimit
  };
  await chrome.storage.local.set({ pendingTask: task });
  
  let url = targetType === 'hashtag' ? withLangEn(`https://www.tiktok.com/tag/${task.hashtag.replace('#', '')}`) : withLangEn(`https://www.tiktok.com/@${state.userList[0].replace('@', '')}`);
  chrome.tabs.update(tab.id, { url });
  showToast('Bắt đầu tự động bình luận...', 'success');
}

async function startBulkFollow() {
  if (!checkLimit(elements.maxFollow)) return;
  if (state.userList.length === 0) { showToast('Danh sách người dùng đang trống', 'error'); return; }
  
  const action = document.querySelector('input[name="followAction"]:checked').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('tiktok.com')) { showToast('Vui lòng mở TikTok trước', 'error'); return; }
  
  setRunningState(true, 'follow');
  clearLog('follow');
  
  const task = {
    action: 'startBulkFollow', followAction: action, userList: state.userList,
    maxUsers: parseInt(elements.maxFollow.value),
    delayMin: parseInt(elements.followDelayMin.value) * 1000,
    delayMax: parseInt(elements.followDelayMax.value) * 1000, processed: 0,
    freeLimit: CONFIG.LIMITS.runtimeFreeLimit
  };
  await chrome.storage.local.set({ pendingTask: task });
  
  chrome.tabs.update(tab.id, { url: withLangEn(`https://www.tiktok.com/@${state.userList[0].replace('@', '')}`) });
  showToast(`Bắt đầu tác vụ hàng loạt: ${action === 'follow' ? 'theo dõi' : 'hủy theo dõi'}...`, 'success');
}

async function stopTask() {
  await chrome.storage.local.remove(['pendingTask']);
  const tabs = await chrome.tabs.query({ url: ['*://www.tiktok.com/*', '*://tiktok.com/*'] });
  for (const tab of tabs) { try { await chrome.tabs.sendMessage(tab.id, { action: 'stop' }); } catch (e) {} }
  setRunningState(false);
  showToast('Đã dừng tác vụ!', 'success');
}

// Message handler
function handleContentMessage(message) {
  switch (message.type) {
    case 'userExtracted':
      if (!state.extractedUsers.includes(message.username)) { state.extractedUsers.push(message.username); saveState(); updateExtractedList(); }
      break;
    case 'extractionComplete': setRunningState(false); showToast(`Hoàn tất! ${state.extractedUsers.length} người dùng`, 'success'); break;
    case 'likeProgress': updateProgress('like', message.current, message.total); addLog('like', message.message, message.success ? 'success' : 'error'); break;
    case 'likeComplete': setRunningState(false); showToast('Đã hoàn tất tự động thả tim!', 'success'); break;
    case 'commentProgress': updateProgress('comment', message.current, message.total); addLog('comment', message.message, message.success ? 'success' : 'error'); break;
    case 'commentComplete': setRunningState(false); showToast('Đã hoàn tất tự động bình luận!', 'success'); break;
    case 'followProgress': updateProgress('follow', message.current, message.total); addLog('follow', message.message, message.success ? 'success' : 'error'); break;
    case 'followComplete': setRunningState(false); showToast('Đã hoàn tất theo dõi hàng loạt!', 'success'); break;
    case 'limitReached': 
      setRunningState(false); 
      if (CONFIG.IS_PREMIUM) {
        showToast('Đã đạt giới hạn gói hiện tại.', 'error');
      }
      break;
    case 'error': setRunningState(false); showToast(message.message, 'error'); break;
  }
}

function setRunningState(running, task = null) {
  state.isRunning = running;
  state.currentTask = running ? task : null;
  const dot = elements.statusIndicator.querySelector('.status-dot');
  const text = elements.statusIndicator.querySelector('.status-text');
  dot.classList.toggle('working', running);
  text.textContent = running ? 'Đang chạy...' : 'Sẵn sàng';
  elements.startExtractBtn.disabled = running; elements.stopExtractBtn.disabled = !running;
  elements.startLikeBtn.disabled = running; elements.stopLikeBtn.disabled = !running;
  elements.startCommentBtn.disabled = running; elements.stopCommentBtn.disabled = !running;
  elements.startFollowBtn.disabled = running; elements.stopFollowBtn.disabled = !running;
}

function updateProgress(type, current, total) {
  const t = document.getElementById(`${type}ProgressText`);
  const f = document.getElementById(`${type}ProgressFill`);
  if (t) t.textContent = `${current} / ${total}`;
  if (f) f.style.width = `${(current / total) * 100}%`;
}

function addLog(type, message, status = '') {
  const box = document.getElementById(`${type}Log`);
  if (!box) return;
  const div = document.createElement('div');
  div.className = `log-item ${status}`;
  div.innerHTML = `<span class="time">${new Date().toLocaleTimeString()}</span> ${message}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function clearLog(type) {
  const box = document.getElementById(`${type}Log`);
  const t = document.getElementById(`${type}ProgressText`);
  const f = document.getElementById(`${type}ProgressFill`);
  if (box) box.innerHTML = '';
  if (t) t.textContent = '0 / 0';
  if (f) f.style.width = '0%';
}

// Helpers
function addComment() {
  const c = elements.newComment.value.trim();
  if (c) { state.comments.push(c); saveState(); updateCommentsList(); elements.newComment.value = ''; }
}

function importComments(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      state.comments.push(...lines); saveState(); updateCommentsList();
      showToast(`Đã nhập ${lines.length} bình luận`, 'success');
    };
    reader.readAsText(file);
  }
  e.target.value = '';
}

function clearComments() { state.comments = []; saveState(); updateCommentsList(); }

function addManualUser() {
  const u = elements.manualUser.value.trim().replace('@', '');
  if (u && !state.userList.includes(u)) { state.userList.push(u); saveState(); updateUserList(); elements.manualUser.value = ''; }
}

function importUsers(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').map(l => l.trim().replace('@', '').replace('\r', '')).filter(l => l && !state.userList.includes(l));
      state.userList.push(...lines); saveState(); updateUserList();
      showToast(`Đã nhập ${lines.length} người dùng`, 'success');
    };
    reader.readAsText(file);
  }
  e.target.value = '';
}

function clearUserList() { state.userList = []; saveState(); updateUserList(); }
function sendExtractedToList() {
  const newUsers = state.extractedUsers.filter(u => !state.userList.includes(u));
  state.userList.push(...newUsers); saveState(); updateUserList();
  showToast(`Đã thêm ${newUsers.length} người dùng`, 'success');
}
function clearExtracted() { state.extractedUsers = []; saveState(); updateExtractedList(); }

function copyToClipboard(arr) {
  if (!arr.length) { showToast('Không có dữ liệu để sao chép', 'error'); return; }
  navigator.clipboard.writeText(arr.join('\n')).then(() => showToast('Đã sao chép!', 'success'));
}

function exportToFile(arr, filename) {
  if (!arr.length) { showToast('Không có dữ liệu để xuất', 'error'); return; }
  const blob = new Blob([arr.join('\n')], { type: 'text/plain' });
  chrome.downloads.download({ url: URL.createObjectURL(blob), filename, saveAs: true });
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
