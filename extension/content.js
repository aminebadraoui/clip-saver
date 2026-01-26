// --- Config & State ---
// To use local backend, switch to: "http://localhost:3001/api"
const API_BASE = "https://api.clipcoba.com/api";
// const API_BASE = "http://localhost:3001/api";
let currentToken = null;
let currentSpaceId = null;
let availableSpaces = [];
let userTags = [];

// --- Auth Sync ---
// --- Auth Sync ---
const syncToken = () => {
    chrome.storage.local.get(['authToken', 'refreshToken'], (result) => {
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
async function attemptExtensionRefresh() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['refreshToken'], async (result) => {
            const rToken = result.refreshToken;
            if (!rToken) { resolve(false); return; }

            try {
                // Use API_BASE, but remove /api suffix for auth endpoint if needed, or assume backend paths
                // API_BASE is .../api. Backend has /auth/refresh at root or under /api?
                // Backend main.py: @app.post("/auth/refresh"). It is NOT under a router prefix, but app root.
                // However, API_BASE is "https://api.clipcoba.com/api".
                // So we need "https://api.clipcoba.com/auth/refresh".
                const authUrl = API_BASE.replace('/api', '/auth/refresh');

                const refreshRes = await fetch(authUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: rToken })
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    currentToken = data.access_token;
                    // Update storage so other tabs/popup know
                    chrome.storage.local.set({ 'authToken': currentToken });
                    console.log("Extension: Token refreshed successfully");
                    resolve(true);
                } else {
                    console.warn("Extension: Refresh failed", refreshRes.status);
                    resolve(false);
                }
            } catch (e) {
                console.error("Extension refresh failed", e);
                resolve(false);
            }
        });
    });
}

async function fetchWithAuth(url, options = {}) {
    if (!currentToken) throw new Error("Please log in to Clip Coba web app first.");

    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${currentToken}`;

    let res = await fetch(url, options);

    if (res.status === 401) {
        console.log("Extension: 401, attempting refresh...");
        const refreshed = await attemptExtensionRefresh();
        if (refreshed) {
            options.headers['Authorization'] = `Bearer ${currentToken}`;
            res = await fetch(url, options);
        }
    }
    return res;
}

const fetchTags = async () => {
    if (!currentToken) return;
    try {
        const res = await fetchWithAuth(`${API_BASE}/tags`);
        if (res.ok) userTags = await res.json();
    } catch (e) { console.error("Error fetching tags", e); }
};

const fetchSpaces = async () => {
    if (!currentToken) return;
    try {
        const res = await fetchWithAuth(`${API_BASE}/spaces/`);
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
        const res = await fetchWithAuth(`${API_BASE}/tags`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color })
        });
        if (res.ok) { const newTag = await res.json(); userTags.push(newTag); return newTag; }
    } catch (e) { console.error("Failed to create tag", e); }
    return null;
}

async function fetchVideoInfo(videoId) {
    // Public endpoint, no auth needed usually? Backend says /api/info.
    // Check main.py: @app.get("/api/info"). No Depends(auth). So correct.
    try { const res = await fetch(`${API_BASE}/info?videoId=${videoId}`); if (res.ok) return await res.json(); } catch (e) { console.error("Backend info fetch failed", e); } return null;
}

async function saveClip(payload) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (currentSpaceId) {
        headers['X-Space-Id'] = currentSpaceId;
    }

    const res = await fetchWithAuth(`${API_BASE}/clips`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        let errorMsg = await res.text();
        try {
            const errorJson = JSON.parse(errorMsg);
            if (errorJson.detail) errorMsg = errorJson.detail;
        } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
    }
    return await res.json();
}

// --- DOM Scraping Helpers ---
function parseCount(str) { if (!str) return 0; str = str.replace(/[^0-9.KMB]/g, ''); const multiplier = str.toUpperCase().endsWith('K') ? 1000 : str.toUpperCase().endsWith('M') ? 1000000 : str.toUpperCase().endsWith('B') ? 1000000000 : 1; const num = parseFloat(str.replace(/[KMB]/i, '')); return Math.round(num * multiplier) || 0; }

function scrapeCurrentPage() {
    try {
        let videoId = new URLSearchParams(window.location.search).get('v');
        let isShort = false;

        if (!videoId && window.location.pathname.startsWith('/shorts/')) {
            videoId = window.location.pathname.split('/shorts/')[1];
            isShort = true;
        }

        if (!videoId) return null;

        let title, channelName, subscriberCount, viewCount, uploadDate;

        if (isShort) {
            title = document.querySelector('ytd-reel-video-renderer[is-active] .yt-reel-metapanel-view-model h2, ytd-reel-video-renderer[is-active] h2.ytShortsVideoTitleViewModelShortsVideoTitle')?.innerText?.trim() || "";
            channelName = document.querySelector('ytd-reel-video-renderer[is-active] .yt-reel-channel-bar-view-model .yt-core-attributed-string a')?.innerText?.trim() || "";
            // Shorts often hide date/views in overlay, simplifying fallback
            subscriberCount = 0;
            viewCount = 0;
            uploadDate = "";
        } else {
            title = document.querySelector('h1.ytd-watch-metadata')?.innerText?.trim() || document.querySelector('meta[property="og:title"]')?.content || "";
            channelName = document.querySelector('ytd-channel-name a')?.innerText?.trim() || "";
            const subCountEl = document.querySelector('#owner-sub-count');
            subscriberCount = parseCount(subCountEl?.innerText?.trim());
            const viewCountMeta = document.querySelector('meta[itemprop="interactionCount"]');
            viewCount = viewCountMeta ? parseInt(viewCountMeta.content) : 0;
            uploadDate = document.querySelector('meta[itemprop="uploadDate"]')?.content || "";
        }

        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        return {
            videoId,
            title,
            channelName,
            subscriberCount,
            viewCount,
            thumbnail,
            uploadDate,
            originalVideoUrl: isShort ? `https://www.youtube.com/shorts/${videoId}` : window.location.href,
            type: isShort ? 'short' : 'video'
        };
    } catch (e) { console.error("Scraping error", e); return null; }
}

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
        <div class="clip-saver-header"><span class="clip-saver-title">Clip Coba</span><span class="clip-saver-close">&times;</span></div>
        ${scoreHtml}
        <div id="cs-space-container" style="padding: 0 12px;"></div>
        <div class="clip-saver-tags-list" id="cs-tags"></div>
        <div class="clip-saver-new-tag">
            <input type="text" class="clip-saver-input" placeholder="New tag..." id="cs-new-tag-input">
            <button class="clip-saver-add-btn">+</button>
        </div>
        <button class="clip-saver-save-btn">Send to Clip Coba</button>
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
                type: videoData.type || "video"
            };
            await saveClip(payload);
            statusDiv.textContent = "Saved!";
            statusDiv.className = "clip-saver-status success";
            setTimeout(cleanup, 1500);
        } catch (e) {
            console.error(e);
            let msg = e.message;
            if (msg.toLowerCase().includes("already exists")) {
                msg = "Video Already Exists";
                statusDiv.style.backgroundColor = "#f97316"; // Orange
            } else {
                // Show actual error if possible, or fallback
                // Truncate if too long
                msg = msg.length > 30 ? "Error: " + msg.substring(0, 27) + "..." : msg;
                statusDiv.style.backgroundColor = "#ef4444"; // Red
            }

            statusDiv.textContent = msg;
            setTimeout(() => {
                statusDiv.textContent = "";
                statusDiv.style.backgroundColor = ""; // Reset
            }, 3000);
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
    // 5. Shorts Actions Overlay
    // We target the action bar container to inject our button
    const shortsActionContainers = document.querySelectorAll('ytd-reel-player-overlay-renderer #actions');
    shortsActionContainers.forEach(container => {
        // Find the parent renderer (the specific short container)
        const parentRenderer = container.closest('ytd-reel-video-renderer');
        if (parentRenderer) injectButton(container, parentRenderer, 'shorts');
    });

    // 6. Channel Page Shorts Grid (New Request)
    // Target: The text container inside the metadata block to flow naturally
    // Structure: .shortsLockupViewModelHostOutsideMetadata -> div (text container)
    const channelShortsTextContainers = document.querySelectorAll('.shortsLockupViewModelHostOutsideMetadata > div:first-child');
    channelShortsTextContainers.forEach(container => {
        const parentViewModel = container.closest('ytm-shorts-lockup-view-model');
        if (parentViewModel) injectButton(container, parentViewModel, 'shorts-grid');
    });
}

function injectButton(container, videoDataContainer, context = 'default') {
    if (container.querySelector('.clip-saver-wrapper')) return;

    // Create a wrapper to isolate our button from flex/grid layouts
    const wrapper = document.createElement('div');
    wrapper.className = 'clip-saver-wrapper';

    // Add context-specific class to wrapper
    if (context === 'search') wrapper.classList.add('clip-saver-wrapper-search');
    if (context === 'lockup') wrapper.classList.add('clip-saver-wrapper-lockup');
    if (context === 'shorts') {
        wrapper.classList.add('clip-saver-wrapper-shorts');
        // Add some basic style for shorts button to fit in vertical list
        wrapper.style.marginTop = '16px';
        wrapper.style.marginBottom = '16px';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
    }
    if (context === 'shorts-grid') {
        wrapper.classList.add('clip-saver-wrapper-shorts-grid');
        // Flow layout: add margin to separate from text
        wrapper.style.marginTop = '4px';
        wrapper.style.marginBottom = '8px';
        wrapper.style.display = 'block';
        // Force left align or inherit
        wrapper.style.textAlign = 'left';
    }
    if (context === 'player') wrapper.classList.add('clip-saver-wrapper-player'); // Legacy/Fallback
    if (context === 'player-metadata') wrapper.classList.add('clip-saver-wrapper-player-metadata');

    const btn = document.createElement('button');
    btn.className = 'clip-saver-btn';
    btn.textContent = 'ClipCoba';

    if (context === 'shorts-grid') {
        // Smaller button for grid
        btn.style.fontSize = '10px';
        btn.style.padding = '2px 6px';
    }


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
    // 2. Shorts Player Overlay Case
    else if (dataContainer.tagName.toLowerCase() === 'ytd-reel-video-renderer') {
        if (dataContainer.hasAttribute('is-active')) {
            videoData = scrapeCurrentPage();
            if (videoData && videoData.videoId) {
                const enriched = await fetchVideoInfo(videoData.videoId);
                if (enriched) videoData = { ...videoData, ...enriched };
            }
        } else {
            videoData = scrapeCurrentPage();
        }
    }
    // 4. Channel Page Shorts Grid Case
    else if (dataContainer.tagName.toLowerCase() === 'ytm-shorts-lockup-view-model') {
        // Find the link
        const link = dataContainer.querySelector('a.shortsLockupViewModelHostEndpoint');
        if (link) {
            const href = link.getAttribute('href');
            // href might be relative e.g. /shorts/ID
            if (href && href.includes('/shorts/')) {
                const vId = href.split('/shorts/')[1];
                if (vId) {
                    let title = "Unknown Short";
                    const titleEl = dataContainer.querySelector('.shortsLockupViewModelHostMetadataTitle span');
                    if (titleEl) title = titleEl.innerText;

                    let viewsTitle = "";
                    const viewsEl = dataContainer.querySelector('.shortsLockupViewModelHostMetadataSubhead span');
                    if (viewsEl) viewsTitle = viewsEl.innerText; // "363k views"

                    videoData = {
                        videoId: vId,
                        title: title,
                        thumbnail: `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`,
                        originalVideoUrl: `https://www.youtube.com${href}`,
                        type: 'short' // explicit short type
                    };
                    const enriched = await fetchVideoInfo(vId);
                    if (enriched) videoData = { ...videoData, ...enriched };
                }
            }
        }
    }
    // 3. Thumbnail / Shelf Case (Default)
    else {
        const link = dataContainer.querySelector('a#thumbnail, a.yt-lockup-view-model__content-image');
        if (link) {
            const href = link.href;
            if (href) {
                const urlObj = new URL(href);
                let vId = urlObj.searchParams.get('v');
                let isShort = false;

                // Handle Shorts Links in Shelves
                if (!vId && urlObj.pathname.startsWith('/shorts/')) {
                    vId = urlObj.pathname.split('/shorts/')[1];
                    isShort = true;
                }

                if (vId) {
                    let title = "Unknown Video";
                    const titleEl = dataContainer.querySelector('#video-title, .yt-lockup-metadata-view-model__title span');
                    if (titleEl) title = titleEl.innerText;

                    videoData = {
                        videoId: vId,
                        title: title,
                        thumbnail: `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`,
                        originalVideoUrl: href,
                        type: isShort ? 'short' : 'video'
                    };
                    const enriched = await fetchVideoInfo(vId);
                    if (enriched) videoData = { ...videoData, ...enriched };
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
