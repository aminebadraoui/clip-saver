// --- Config & State ---
// To use local backend, switch to: "http://localhost:3001/api"
const API_BASE = "https://api.clipcoba.com/api";
let currentToken = null;
let currentSpaceId = null;
let availableSpaces = [];
let userTags = [];

// --- Auth Sync ---
const syncToken = () => {
    chrome.storage.local.get(['authToken'], (result) => {
        currentToken = result.authToken || null;
        if (currentToken) {
            fetchTags();
            fetchSpaces();
        }
    });
};
syncToken();
chrome.storage.onChanged.addListener(syncToken);

// --- API Interactions ---
const fetchTags = async () => {
    if (!currentToken) return;
    try {
        const res = await fetch(`${API_BASE}/tags`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (res.ok) userTags = await res.json();
    } catch (e) { console.error("Error fetching tags", e); }
};

const fetchSpaces = async () => {
    if (!currentToken) return;
    try {
        const res = await fetch(`${API_BASE}/spaces/`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (res.ok) {
            availableSpaces = await res.json();
            // Load saved space preference
            chrome.storage.local.get(['selectedSpaceId'], (result) => {
                if (result.selectedSpaceId && availableSpaces.find(s => s.id === result.selectedSpaceId)) {
                    currentSpaceId = result.selectedSpaceId;
                } else if (availableSpaces.length > 0) {
                    currentSpaceId = availableSpaces[0].id; // Default to first
                }
            });
        }
    } catch (e) { console.error("Error fetching spaces", e); }
};

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
    if (!currentToken) throw new Error("Please log in to Clip Coba web app first.");

    const headers = {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
    };

    if (currentSpaceId) {
        headers['X-Space-Id'] = currentSpaceId;
    }

    const res = await fetch(`${API_BASE}/clips`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text()); return await res.json();
}

// --- DOM Scraping Helpers ---
function parseCount(str) { if (!str) return 0; str = str.replace(/[^0-9.KMB]/g, ''); const multiplier = str.toUpperCase().endsWith('K') ? 1000 : str.toUpperCase().endsWith('M') ? 1000000 : str.toUpperCase().endsWith('B') ? 1000000000 : 1; const num = parseFloat(str.replace(/[KMB]/i, '')); return Math.round(num * multiplier) || 0; }
function scrapeCurrentPage() { try { const videoId = new URLSearchParams(window.location.search).get('v'); if (!videoId) return null; const title = document.querySelector('h1.ytd-watch-metadata')?.innerText?.trim() || document.querySelector('meta[property="og:title"]')?.content || ""; const channelName = document.querySelector('ytd-channel-name a')?.innerText?.trim() || ""; const subCountEl = document.querySelector('#owner-sub-count'); const subscriberCount = parseCount(subCountEl?.innerText?.trim()); const viewCountMeta = document.querySelector('meta[itemprop="interactionCount"]'); let viewCount = viewCountMeta ? parseInt(viewCountMeta.content) : 0; const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`; const uploadDate = document.querySelector('meta[itemprop="uploadDate"]')?.content || ""; return { videoId, title, channelName, subscriberCount, viewCount, thumbnail, uploadDate, originalVideoUrl: window.location.href }; } catch (e) { return null; } }

// --- UI Injection ---
let activePopupCleanup = null;

function createDropdown(x, y, videoData, anchorElement) {
    // Cleanup previous if exists
    if (activePopupCleanup) activePopupCleanup();

    // Failsafe remove from DOM
    document.querySelectorAll('.clip-saver-dropdown').forEach(el => el.remove());

    const dropdown = document.createElement('div');
    dropdown.className = 'clip-saver-dropdown';
    dropdown.style.left = `${x}px`;
    dropdown.style.top = `${y}px`;
    let selectedTagIds = [];

    // Define cleanup first so we can use it in handlers
    const cleanup = () => {
        if (dropdown.isConnected) dropdown.remove();
        window.removeEventListener('scroll', onScroll, { capture: true });
        if (activePopupCleanup === cleanup) activePopupCleanup = null;
    };

    // Scroll handler: Close on scroll unless scrolling inside the dropdown
    const onScroll = (e) => {
        if (dropdown.contains(e.target)) return;
        cleanup();
    };

    // Register cleanup & listeners
    activePopupCleanup = cleanup;
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    // 1. Construct Inner HTML (Original Layout + Space Selector)
    let scoreHtml = '';
    if (videoData.outlierScore) {
        scoreHtml = `<div style="padding: 0 12px 8px 12px; font-size: 11px; color: #eab308; font-weight: bold;">Outlier Score: ${videoData.outlierScore}x</div>`;
    }

    dropdown.innerHTML = `
        <div class="clip-saver-header"><span class="clip-saver-title">Bookmark to Clip Coba</span><span class="clip-saver-close">&times;</span></div>
        ${scoreHtml}
        <div id="cs-space-container" style="padding: 0 12px;"></div>
        <div class="clip-saver-tags-list" id="cs-tags"></div>
        <div class="clip-saver-new-tag">
            <input type="text" class="clip-saver-input" placeholder="New tag..." id="cs-new-tag-input">
            <button class="clip-saver-add-btn">+</button>
        </div>
        <button class="clip-saver-save-btn">SAVE BOOKMARK</button>
        <div class="clip-saver-status" id="cs-status"></div>
    `;
    document.body.appendChild(dropdown);

    // 2. Inject Space Selector
    const spaceContainer = dropdown.querySelector('#cs-space-container');
    const spaceSelect = document.createElement('select');
    spaceSelect.style.width = '100%';
    spaceSelect.style.padding = '6px';
    spaceSelect.style.marginBottom = '4px';
    spaceSelect.style.border = '1px solid #ddd';
    spaceSelect.style.borderRadius = '4px';
    spaceSelect.style.fontSize = '13px';

    // Add default options first in case array is empty
    if (availableSpaces.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = "Default Space";
        spaceSelect.appendChild(opt);
    } else {
        availableSpaces.forEach(space => {
            const opt = document.createElement('option');
            opt.value = space.id;
            opt.textContent = space.name;
            if (space.id === currentSpaceId) opt.selected = true;
            spaceSelect.appendChild(opt);
        });
    }

    spaceSelect.onchange = (e) => {
        currentSpaceId = e.target.value;
        chrome.storage.local.set({ selectedSpaceId: currentSpaceId });
    };
    spaceContainer.appendChild(spaceSelect);

    // 3. Render Tags (Restored Multi-select Logic)
    const tagsContainer = dropdown.querySelector('#cs-tags');
    function renderTags() {
        tagsContainer.innerHTML = '';
        if (userTags.length === 0) {
            tagsContainer.innerHTML = '<div style="padding:8px; color:#666; font-size:12px;">No tags found.</div>';
        }
        userTags.forEach(tag => {
            const chip = document.createElement('div');
            chip.className = `clip-saver-tag-chip ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`;
            chip.textContent = tag.name;
            chip.onclick = () => {
                if (selectedTagIds.includes(tag.id)) selectedTagIds = selectedTagIds.filter(id => id !== tag.id);
                else selectedTagIds.push(tag.id);
                renderTags();
            };
            tagsContainer.appendChild(chip);
        });
    }
    renderTags();

    // 4. Event Handlers (Close, Add Tag, Save)
    const closeBtn = dropdown.querySelector('.clip-saver-close');
    closeBtn.onclick = cleanup;

    const addBtn = dropdown.querySelector('.clip-saver-add-btn');
    const input = dropdown.querySelector('#cs-new-tag-input');
    addBtn.onclick = async () => {
        const val = input.value.trim();
        if (val) {
            const newTag = await createTag(val);
            if (newTag) {
                selectedTagIds.push(newTag.id);
                renderTags();
                input.value = '';
            }
        }
    };

    const saveBtn = dropdown.querySelector('.clip-saver-save-btn');
    const statusDiv = dropdown.querySelector('#cs-status');
    saveBtn.onclick = async () => {
        statusDiv.textContent = "Saving...";
        statusDiv.className = "clip-saver-status";
        try {
            const payload = {
                id: crypto.randomUUID(),
                ...videoData,
                createdAt: Date.now(),
                tagIds: selectedTagIds,
                type: "video"
            };
            await saveClip(payload);
            statusDiv.textContent = "Saved!";
            statusDiv.className = "clip-saver-status success";
            setTimeout(cleanup, 1500);
        } catch (e) {
            statusDiv.textContent = e.message.substring(0, 30);
            statusDiv.className = "clip-saver-status error";
        }
    };

    // Position Handling
    const rect = dropdown.getBoundingClientRect();
    if (rect.right > window.innerWidth) dropdown.style.left = `${window.innerWidth - rect.width - 20}px`;
    if (rect.bottom > window.innerHeight) dropdown.style.top = `${window.innerHeight - rect.height - 20}px`;
}

// --- Observer & Injection ---
// console.log("Clip Coba: Content script initialized. Observing mutations...");

function injectAll() {
    // 1. Home/Channel Grid: Target #meta within ytd-rich-item-renderer
    // We target #meta to append the button *below* the text stack, preventing it from
    // squeezing the title horizontally which happens if we inject into the flex-row #details.
    const richMetaContainers = document.querySelectorAll('ytd-rich-item-renderer #meta');
    richMetaContainers.forEach(meta => {
        const parentRenderer = meta.closest('ytd-rich-item-renderer');
        if (parentRenderer) injectButton(meta, parentRenderer);
    });

    // 2. Sidebar: Target #details within ytd-compact-video-renderer
    const compactDetailsContainers = document.querySelectorAll('ytd-compact-video-renderer #details');
    compactDetailsContainers.forEach(details => {
        const parentRenderer = details.closest('ytd-compact-video-renderer');
        if (parentRenderer) injectButton(details, parentRenderer);
    });

    // 3. Search Page: Target #meta within ytd-video-renderer (List View)
    const searchMetaContainers = document.querySelectorAll('ytd-video-renderer #meta');
    searchMetaContainers.forEach(meta => {
        const parentRenderer = meta.closest('ytd-video-renderer');
        if (parentRenderer) injectButton(meta, parentRenderer, 'search');
    });

    // 3. New UI / Shorts / Ad Layouts
    const textContainers = document.querySelectorAll('.yt-lockup-metadata-view-model__text-container');
    textContainers.forEach(container => {
        const parentLockup = container.closest('yt-lockup-view-model');
        if (parentLockup) injectButton(container, parentLockup, 'lockup');
    });

    // 4. Main Player - Metadata Section (Below Sub Count)
    const ownerMetadata = document.querySelector('ytd-watch-metadata ytd-video-owner-renderer #upload-info');
    // Fallback to scrape from #movie_player for data, but inject into metadata
    const playerForData = document.querySelector('#movie_player');

    if (ownerMetadata && playerForData) {
        // Pass 'player-metadata' context
        injectButton(ownerMetadata, playerForData, 'player-metadata');
    }
}

function injectButton(container, videoDataContainer, context = 'default') {
    if (container.querySelector('.clip-saver-wrapper')) return;

    // Create a wrapper to isolate our button from flex/grid layouts
    const wrapper = document.createElement('div');
    wrapper.className = 'clip-saver-wrapper';

    // Add context-specific class to wrapper
    if (context === 'search') wrapper.classList.add('clip-saver-wrapper-search');
    if (context === 'lockup') wrapper.classList.add('clip-saver-wrapper-lockup');
    if (context === 'player') wrapper.classList.add('clip-saver-wrapper-player'); // Legacy/Fallback
    if (context === 'player-metadata') wrapper.classList.add('clip-saver-wrapper-player-metadata');

    const btn = document.createElement('button');
    btn.className = 'clip-saver-btn';
    btn.textContent = 'BOOKMARK';

    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleSnapClick(e, btn, videoDataContainer); };

    wrapper.appendChild(btn);

    // Context specific injection logic
    if (context === 'player') {
        // Keeping this logic just in case, though we are moving away from it for the main player
        wrapper.style.position = 'absolute';
        wrapper.style.top = '10px';
        wrapper.style.right = '10px';
        wrapper.style.zIndex = '2000';
    }
    // 'player-metadata' does NOT need absolute positioning, it should flow in the document
    else {
        // For other contexts, ensure the container is relative for proper positioning of the wrapper
        // BUT for 'player-metadata' we might NOT want position relative on the parent if it messes up flex layouts, 
        // usually it's fine though.
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.position === 'static') {
            container.style.position = 'relative';
        }
    }

    container.appendChild(wrapper);
}

async function handleSnapClick(e, btn, dataContainer) {
    if (!currentToken) { alert("Clip Coba: Please log in to the web app first!"); return; }
    let videoData = null;

    // 1. Player Case
    if (dataContainer.id === 'movie_player') {
        videoData = scrapeCurrentPage();
        if (videoData && videoData.videoId) {
            const enriched = await fetchVideoInfo(videoData.videoId);
            if (enriched) videoData = { ...videoData, ...enriched };
        }
    }
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

    if (videoData) {
        const rect = btn.getBoundingClientRect();
        createDropdown(rect.left, rect.bottom + 5, videoData, btn);
    } else {
        alert("Could not bookmark this video.");
    }
}

// Start observing and injecting
const observer = new MutationObserver(injectAll);
observer.observe(document.body, { childList: true, subtree: true });

setInterval(injectAll, 2000);
injectAll();
