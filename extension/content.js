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
function createDropdown(x, y, videoData, anchorElement) {
    document.querySelectorAll('.clip-saver-dropdown').forEach(el => el.remove());
    const dropdown = document.createElement('div'); dropdown.className = 'clip-saver-dropdown'; dropdown.style.left = `${x}px`; dropdown.style.top = `${y}px`; let selectedTagIds = [];
    dropdown.innerHTML = `<div class="clip-saver-header"><span class="clip-saver-title">Snap to Clip Coba</span><span class="clip-saver-close">&times;</span></div>`;
    document.body.appendChild(dropdown);    // Space Selector
    const spaceSelector = document.createElement('div');
    spaceSelector.style.marginBottom = '8px';

    // Create custom select for spaces
    const spaceSelect = document.createElement('select');
    spaceSelect.style.width = '100%';
    spaceSelect.style.padding = '4px';
    spaceSelect.style.marginBottom = '4px';
    spaceSelect.style.border = '1px solid #ddd';
    spaceSelect.style.borderRadius = '4px';

    if (availableSpaces.length > 0) {
        availableSpaces.forEach(space => {
            const opt = document.createElement('option');
            opt.value = space.id;
            opt.textContent = space.name;
            if (space.id === currentSpaceId) opt.selected = true;
            spaceSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.textContent = "Default Space";
        spaceSelect.appendChild(opt);
    }

    spaceSelect.onchange = (e) => {
        currentSpaceId = e.target.value;
        chrome.storage.local.set({ selectedSpaceId: currentSpaceId });
    };

    spaceSelector.appendChild(spaceSelect);
    dropdown.appendChild(spaceSelector);

    // Tags Container
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'clip-coba-tags';
    dropdown.appendChild(tagsContainer);

    // Render Tags Function
    const renderTags = () => {
        tagsContainer.innerHTML = '';
        if (userTags.length === 0) {
            tagsContainer.textContent = "No tags found.";
            return;
        }
        userTags.forEach(tag => {
            const tagEl = document.createElement('div');
            tagEl.className = 'clip-coba-tag';
            tagEl.textContent = tag.name;
            tagEl.style.backgroundColor = tag.color || '#eee';
            tagEl.onclick = (e) => {
                e.stopPropagation(); // Prevent closing dropdown
                // Toggle selection logic... for now we just snap with this tag? 
                // Original logic was implicit. Let's assume multi-select logic later, 
                // for now proceed to save with this tag.
                saveClip({ ...videoData, tagIds: [tag.id] }) // Snap with this tag immediately? Or separate button?
                    .then(() => {
                        alert(`Saved to ${availableSpaces.find(s => s.id === currentSpaceId)?.name || 'Default Space'}!`);
                        dropdown.remove();
                    })
                    .catch(err => alert("Error: " + err.message));
            };
            tagsContainer.appendChild(tagEl);
        });
    };
    renderTags();

    // Snap without tags button
    const snapBtn = document.createElement('button');
    snapBtn.textContent = 'Quick Snap (No Tag)';
    snapBtn.style.width = '100%';
    snapBtn.style.marginTop = '8px';
    snapBtn.style.padding = '6px';
    snapBtn.style.backgroundColor = '#cc0000';
    snapBtn.style.color = '#fff';
    snapBtn.style.border = 'none';
    snapBtn.style.borderRadius = '4px';
    snapBtn.style.cursor = 'pointer';
    snapBtn.onclick = () => {
        saveClip({ ...videoData, tagIds: [] })
            .then(() => {
                alert(`Saved to ${availableSpaces.find(s => s.id === currentSpaceId)?.name || 'Default Space'}!`);
                dropdown.remove();
            })
            .catch(err => alert("Error: " + err.message));
    };
    dropdown.appendChild(snapBtn);

    // Prevent closing when clicking inside
    dropdown.onclick = (e) => e.stopPropagation();
    const closeBtn = dropdown.querySelector('.clip-saver-close');
    closeBtn.onclick = () => dropdown.remove();

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

    // 4. Main Player
    const player = document.querySelector('#movie_player');
    if (player) {
        if (!player.querySelector('.clip-saver-wrapper')) {
            injectButton(player, player, 'player');
        }
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
    if (context === 'player') wrapper.classList.add('clip-saver-wrapper-player');

    const btn = document.createElement('button');
    btn.className = 'clip-saver-btn';
    btn.textContent = 'SNAP';

    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleSnapClick(e, btn, videoDataContainer); };

    wrapper.appendChild(btn);

    // Context specific injection logic
    if (context === 'player') {
        wrapper.style.position = 'absolute';
        wrapper.style.top = '10px';
        wrapper.style.right = '10px';
        wrapper.style.zIndex = '2000';
    } else {
        // For other contexts, ensure the container is relative for proper positioning of the wrapper
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

    if (videoData) {
        const rect = btn.getBoundingClientRect();
        createDropdown(rect.left, rect.bottom + 5, videoData, btn);
    } else {
        alert("Could not snap this video.");
    }
}

// Start observing and injecting
const observer = new MutationObserver(injectAll);
observer.observe(document.body, { childList: true, subtree: true });

setInterval(injectAll, 2000);
injectAll();
