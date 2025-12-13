// --- Config & State ---
const API_BASE = "http://localhost:3001/api";
let currentToken = null;
let userTags = [];

// --- Auth Sync ---
function syncToken() {
    chrome.storage.local.get(['authToken'], (result) => {
        currentToken = result.authToken || null;
        if (currentToken) fetchTags();
    });
}
syncToken();
chrome.storage.onChanged.addListener(syncToken);

// --- API Interactions ---
async function fetchTags() {
    if (!currentToken) return;
    try {
        const res = await fetch(`${API_BASE}/tags`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (res.ok) userTags = await res.json();
    } catch (e) { console.error("Failed to fetch tags", e); }
}

async function createTag(name, color = "#cc0000") {
    if (!currentToken) return null;
    try {
        const res = await fetch(`${API_BASE}/tags`, { method: "POST", headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
        if (res.ok) { const newTag = await res.json(); userTags.push(newTag); return newTag; }
    } catch (e) { console.error("Failed to create tag", e); }
    return null;
}

async function fetchVideoInfo(videoId) {
    try { const res = await fetch(`${API_BASE}/info?videoId=${videoId}`); if (res.ok) return await res.json(); } catch (e) { console.error("Backend info fetch failed", e); } return null;
}

async function saveClip(payload) {
    if (!currentToken) throw new Error("Please log in to Clip Saver web app first.");
    const res = await fetch(`${API_BASE}/clips`, { method: "POST", headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text()); return await res.json();
}

// --- DOM Scraping Helpers ---
function parseCount(str) { if (!str) return 0; str = str.replace(/[^0-9.KMB]/g, ''); const multiplier = str.toUpperCase().endsWith('K') ? 1000 : str.toUpperCase().endsWith('M') ? 1000000 : str.toUpperCase().endsWith('B') ? 1000000000 : 1; const num = parseFloat(str.replace(/[KMB]/i, '')); return Math.round(num * multiplier) || 0; }
function scrapeCurrentPage() { try { const videoId = new URLSearchParams(window.location.search).get('v'); if (!videoId) return null; const title = document.querySelector('h1.ytd-watch-metadata')?.innerText?.trim() || document.querySelector('meta[property="og:title"]')?.content || ""; const channelName = document.querySelector('ytd-channel-name a')?.innerText?.trim() || ""; const subCountEl = document.querySelector('#owner-sub-count'); const subscriberCount = parseCount(subCountEl?.innerText?.trim()); const viewCountMeta = document.querySelector('meta[itemprop="interactionCount"]'); let viewCount = viewCountMeta ? parseInt(viewCountMeta.content) : 0; const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`; const uploadDate = document.querySelector('meta[itemprop="uploadDate"]')?.content || ""; return { videoId, title, channelName, subscriberCount, viewCount, thumbnail, uploadDate, originalVideoUrl: window.location.href }; } catch (e) { return null; } }

// --- UI Injection ---
function createDropdown(x, y, videoData, anchorElement) {
    document.querySelectorAll('.clip-saver-dropdown').forEach(el => el.remove());
    const dropdown = document.createElement('div'); dropdown.className = 'clip-saver-dropdown'; dropdown.style.left = `${x}px`; dropdown.style.top = `${y}px`; let selectedTagIds = [];
    dropdown.innerHTML = `<div class="clip-saver-header"><span class="clip-saver-title">Snap: ${videoData.title.substring(0, 20)}...</span><span class="clip-saver-close">&times;</span></div><div class="clip-saver-tags-list" id="cs-tags"></div><div class="clip-saver-new-tag"><input type="text" class="clip-saver-input" placeholder="New tag..." id="cs-new-tag-input"><button class="clip-saver-add-btn">+</button></div><button class="clip-saver-save-btn">SAVE CLIP</button><div class="clip-saver-status" id="cs-status"></div>`;
    document.body.appendChild(dropdown); const tagsContainer = dropdown.querySelector('#cs-tags');
    function renderTags() { tagsContainer.innerHTML = ''; userTags.forEach(tag => { const chip = document.createElement('div'); chip.className = `clip-saver-tag-chip ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`; chip.textContent = tag.name; chip.onclick = () => { if (selectedTagIds.includes(tag.id)) selectedTagIds = selectedTagIds.filter(id => id !== tag.id); else selectedTagIds.push(tag.id); renderTags(); }; tagsContainer.appendChild(chip); }); } renderTags();
    const closeBtn = dropdown.querySelector('.clip-saver-close'); closeBtn.onclick = () => dropdown.remove(); const addBtn = dropdown.querySelector('.clip-saver-add-btn'); const input = dropdown.querySelector('#cs-new-tag-input');
    addBtn.onclick = async () => { const val = input.value.trim(); if (val) { const newTag = await createTag(val); if (newTag) { selectedTagIds.push(newTag.id); renderTags(); input.value = ''; } } };
    const saveBtn = dropdown.querySelector('.clip-saver-save-btn'); const statusDiv = dropdown.querySelector('#cs-status');
    saveBtn.onclick = async () => { statusDiv.textContent = "Saving..."; statusDiv.className = "clip-saver-status"; try { const payload = { id: crypto.randomUUID(), ...videoData, createdAt: Date.now(), tagIds: selectedTagIds, type: "video" }; await saveClip(payload); statusDiv.textContent = "Saved!"; statusDiv.className = "clip-saver-status success"; setTimeout(() => dropdown.remove(), 1500); } catch (e) { statusDiv.textContent = e.message.substring(0, 30); statusDiv.className = "clip-saver-status error"; } };
    const rect = dropdown.getBoundingClientRect(); if (rect.right > window.innerWidth) dropdown.style.left = `${window.innerWidth - rect.width - 20}px`; if (rect.bottom > window.innerHeight) dropdown.style.top = `${window.innerHeight - rect.height - 20}px`;
}

function injectButton(container, videoDataContainer) {
    if (container.querySelector('.clip-saver-btn')) return;
    const btn = document.createElement('button'); btn.className = 'clip-saver-btn'; btn.textContent = 'SNAP';
    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleSnapClick(e, btn, videoDataContainer); };
    container.style.position = 'relative'; // Ensure relative
    container.appendChild(btn);
}

// --- Observer & Injection ---
console.log("Clip Saver: Content script initialized. Observing mutations...");
const observer = new MutationObserver(injectAll);
observer.observe(document.body, { childList: true, subtree: true });

function injectAll() {
    // 1. Standard Layout: Target #details within ytd-rich-item-renderer
    const detailsContainers = document.querySelectorAll('ytd-rich-item-renderer #details, ytd-compact-video-renderer #details');
    detailsContainers.forEach(details => {
        // We inject button into #details, but need video data from parent ytd-rich-item-renderer
        const parentRenderer = details.closest('ytd-rich-item-renderer, ytd-compact-video-renderer');
        if (parentRenderer) injectButton(details, parentRenderer);
    });

    // 2. New Layout: Target .yt-lockup-metadata-view-model__text-container
    // This ensures it flows *after* the title and metadata (views)
    const textContainers = document.querySelectorAll('.yt-lockup-metadata-view-model__text-container');
    textContainers.forEach(container => {
        // We inject into the text container
        // The data comes from the closest lockup-view-model
        const parentLockup = container.closest('yt-lockup-view-model');
        if (parentLockup) injectButton(container, parentLockup);
    });

    // 3. Main Player
    const player = document.querySelector('#movie_player');
    if (player) {
        // for main player, keep absolute top-right behavior?
        // The user said "under number of views". On main player that's hard (view count is in description/info).
        // Let's keep main player button in the player overlay for now as it's the most reliable spot, 
        // expecting the user meant thumbnails in the list.
        // We might need to handle player distinct styles?
        // We can add a class for player button if needed.
        if (!player.querySelector('.clip-saver-btn')) {
            injectButton(player, player);
            // Force absolute for player button only
            const btn = player.querySelector('.clip-saver-btn');
            if (btn) {
                btn.style.position = 'absolute';
                btn.style.top = '10px';
                btn.style.right = '10px';
            }
        }
    }
}

async function handleSnapClick(e, btn, dataContainer) {
    if (!currentToken) { alert("Clip Saver: Please log in to the web app first!"); return; }
    let videoData = null;

    // 1. Player Case
    if (dataContainer.id === 'movie_player') { videoData = scrapeCurrentPage(); }
    // 2. Thumbnail Case (dataContainer is renderer or lockup)
    else {
        const link = dataContainer.querySelector('a#thumbnail, a.yt-lockup-view-model__content-image');
        if (link) {
            const href = link.href;
            if (href) {
                const urlObj = new URL(href); const vId = urlObj.searchParams.get('v');
                if (vId) {
                    let title = "Unknown Video";
                    const titleEl = dataContainer.querySelector('#video-title, .yt-lockup-metadata-view-model__title span');
                    if (titleEl) title = titleEl.innerText;
                    videoData = { videoId: vId, title: title, thumbnail: `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`, originalVideoUrl: href };
                    const enriched = await fetchVideoInfo(vId); if (enriched) videoData = { ...videoData, ...enriched };
                }
            }
        }
    }

    if (videoData) { const rect = btn.getBoundingClientRect(); createDropdown(rect.left, rect.bottom + 5, videoData, btn); } else { alert("Could not snap this video."); }
}

setInterval(injectAll, 2000);
injectAll();
