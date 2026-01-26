// --- Config & State ---
const API_BASE = "https://api.clipcoba.com/api";
// const API_BASE = "http://localhost:3001/api";

let currentToken = null;
let availableSpaces = [];
let selectedImages = new Set();

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeYouTubeTab();
    initializeImagesTab();
});

// --- Tab Management ---
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Load images when switching to images tab
            if (tabName === 'images') {
                loadPageImages();
            }
        });
    });
}

// --- YouTube Tab (Original Functionality) ---
function initializeYouTubeTab() {
    const statusText = document.getElementById('auth-status-text');
    const subText = document.getElementById('auth-subtext');
    const statusIcon = document.querySelector('.status-icon');

    chrome.storage.local.get(['authToken'], (result) => {
        currentToken = result.authToken;

        if (currentToken) {
            statusText.textContent = 'Logged In';
            subText.textContent = 'Extension is active on YouTube';
            statusIcon.classList.add('active');
        } else {
            statusText.textContent = 'Not Logged In';
            subText.textContent = 'Please log in to ClipCoba web app';
        }
    });

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.authToken) {
            currentToken = changes.authToken.newValue;
            if (currentToken) {
                statusText.textContent = 'Logged In';
                subText.textContent = 'Extension is active on YouTube';
                statusIcon.classList.add('active');
            } else {
                statusText.textContent = 'Not Logged In';
                subText.textContent = 'Please log in to ClipCoba web app';
                statusIcon.classList.remove('active');
            }
        }
    });
}

// --- Images Tab ---
function initializeImagesTab() {
    const spaceSelect = document.getElementById('space-select');
    const moodboardSelect = document.getElementById('moodboard-select');
    const saveBtn = document.getElementById('save-images-btn');
    const createSection = document.getElementById('create-moodboard-section');
    const showCreateFormBtn = document.getElementById('show-create-form');
    const createForm = document.getElementById('create-form');
    const createMoodboardBtn = document.getElementById('create-moodboard-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const newMoodboardNameInput = document.getElementById('new-moodboard-name');
    const newMoodboardDescInput = document.getElementById('new-moodboard-description');
    const statusDiv = document.getElementById('save-status');

    // Load spaces
    chrome.storage.local.get(['authToken'], async (result) => {
        currentToken = result.authToken;
        if (currentToken) {
            await loadSpaces();
        }
    });

    // Space selection handler
    spaceSelect.addEventListener('change', async () => {
        const spaceId = spaceSelect.value;
        moodboardSelect.innerHTML = '<option value="">Loading...</option>';
        moodboardSelect.disabled = true;
        saveBtn.disabled = true;
        createSection.style.display = 'none';
        createForm.style.display = 'none';

        if (spaceId) {
            const moodboards = await fetchMoodboards(spaceId);
            moodboardSelect.innerHTML = '<option value="">Select a moodboard...</option>';

            if (moodboards.length === 0) {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No moodboards in this space";
                moodboardSelect.appendChild(option);
            } else {
                moodboards.forEach(moodboard => {
                    const option = document.createElement('option');
                    option.value = moodboard.id;
                    option.textContent = moodboard.name;
                    moodboardSelect.appendChild(option);
                });
            }

            moodboardSelect.disabled = false;
            createSection.style.display = 'block';
        }
    });

    // Moodboard selection handler
    moodboardSelect.addEventListener('change', updateSaveButton);

    // Show/hide create form
    showCreateFormBtn.addEventListener('click', () => {
        createForm.style.display = 'block';
        newMoodboardNameInput.focus();
    });

    cancelCreateBtn.addEventListener('click', () => {
        createForm.style.display = 'none';
        newMoodboardNameInput.value = '';
        newMoodboardDescInput.value = '';
    });

    // Create new moodboard
    createMoodboardBtn.addEventListener('click', async () => {
        const spaceId = spaceSelect.value;
        const name = newMoodboardNameInput.value.trim();

        if (!name) {
            showStatus('Please enter a moodboard name', 'error');
            return;
        }

        createMoodboardBtn.disabled = true;
        showStatus('Creating moodboard...', 'info');

        try {
            const response = await fetch(`${API_BASE}/moodboards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    name: name,
                    description: newMoodboardDescInput.value.trim() || undefined,
                    space_id: spaceId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create moodboard');
            }

            const newMoodboard = await response.json();

            // Add to dropdown and select it
            const option = document.createElement('option');
            option.value = newMoodboard.id;
            option.textContent = newMoodboard.name;
            option.selected = true;
            moodboardSelect.appendChild(option);

            // Hide form
            createForm.style.display = 'none';
            newMoodboardNameInput.value = '';
            newMoodboardDescInput.value = '';

            showStatus('✓ Moodboard created!', 'success');
            updateSaveButton();

            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'status-message';
            }, 2000);
        } catch (error) {
            showStatus(error.message || 'Failed to create moodboard', 'error');
        } finally {
            createMoodboardBtn.disabled = false;
        }
    });

    // Save images button
    saveBtn.addEventListener('click', saveSelectedImages);
}

// --- API Functions ---
async function loadSpaces() {
    if (!currentToken) return;

    try {
        const response = await fetch(`${API_BASE}/spaces/`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            availableSpaces = await response.json();
            const spaceSelect = document.getElementById('space-select');
            spaceSelect.innerHTML = '<option value="">Select a space...</option>';

            availableSpaces.forEach(space => {
                const option = document.createElement('option');
                option.value = space.id;
                option.textContent = space.name;
                spaceSelect.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Error fetching spaces", e);
    }
}

async function fetchMoodboards(spaceId) {
    if (!currentToken) return [];

    try {
        const response = await fetch(`${API_BASE}/moodboards?space_id=${spaceId}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error("Error fetching moodboards", e);
    }
    return [];
}

// --- Image Loading ---
async function loadPageImages() {
    const gallery = document.getElementById('image-gallery');
    gallery.innerHTML = '<div class="loading">Loading images...</div>';

    if (!currentToken) {
        gallery.innerHTML = '<div class="no-images">Please log in to save images</div>';
        return;
    }

    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Execute script to extract images
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractImages
        });

        const images = results[0].result;

        if (!images || images.length === 0) {
            gallery.innerHTML = '<div class="no-images">No images found on this page</div>';
            return;
        }

        // Render images
        gallery.innerHTML = '';
        images.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            item.dataset.index = index;
            item.dataset.src = img.src;

            item.innerHTML = `
                <img src="${img.src}" alt="${img.alt || 'Image'}" loading="lazy">
                <div class="checkbox"></div>
            `;

            item.addEventListener('click', () => toggleImageSelection(item));
            gallery.appendChild(item);
        });

    } catch (error) {
        console.error('Error loading images:', error);
        gallery.innerHTML = '<div class="no-images">Failed to load images. Try reloading the page.</div>';
    }
}

// Function to inject into page to extract images
function extractImages() {
    return Array.from(document.images)
        .filter(img => img.naturalWidth >= 100 && img.naturalHeight >= 100)
        .map(img => ({
            src: img.src,
            width: img.naturalWidth,
            height: img.naturalHeight,
            alt: img.alt || ''
        }))
        .slice(0, 100); // Limit to 100 images to avoid overwhelming
}

// --- Image Selection ---
function toggleImageSelection(item) {
    const src = item.dataset.src;

    if (selectedImages.has(src)) {
        selectedImages.delete(src);
        item.classList.remove('selected');
    } else {
        selectedImages.add(src);
        item.classList.add('selected');
    }

    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.getElementById('save-images-btn');
    const moodboardSelect = document.getElementById('moodboard-select');
    const count = selectedImages.size;

    if (count > 0 && moodboardSelect.value) {
        saveBtn.disabled = false;
        saveBtn.textContent = `Save ${count} Image${count > 1 ? 's' : ''}`;
    } else {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Save Images';
    }
}

// --- Save Images ---
async function saveSelectedImages() {
    const spaceSelect = document.getElementById('space-select');
    const moodboardSelect = document.getElementById('moodboard-select');
    const saveBtn = document.getElementById('save-images-btn');

    const spaceId = spaceSelect.value;
    const moodboardId = moodboardSelect.value;

    if (!spaceId || !moodboardId || selectedImages.size === 0) {
        showStatus('Please select space, moodboard, and at least one image', 'error');
        return;
    }

    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    let saved = 0;
    const total = selectedImages.size;

    try {
        // Get current page URL
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const pageUrl = tab.url;

        for (const imageUrl of selectedImages) {
            saveBtn.textContent = `Saving ${saved + 1}/${total}...`;

            try {
                await saveImage(imageUrl, pageUrl, spaceId, moodboardId);
                saved++;
            } catch (error) {
                console.error('Failed to save image:', imageUrl, error);
            }
        }

        showStatus(`✓ Saved ${saved} of ${total} images!`, 'success');

        // Clear selection
        selectedImages.clear();
        document.querySelectorAll('.image-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        updateSaveButton();

        setTimeout(() => {
            document.getElementById('save-status').textContent = '';
        }, 3000);

    } catch (error) {
        showStatus('Failed to save images', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

async function saveImage(imageUrl, pageUrl, spaceId, moodboardId) {
    const domain = new URL(pageUrl).hostname;
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const title = filename.split('?')[0] || `Image from ${domain}`;

    const imageData = {
        title: title,
        image_url: imageUrl,
        source_url: pageUrl,
        thumbnail_url: imageUrl,
        tagIds: [],
        moodboard_id: moodboardId
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };

    if (spaceId) {
        headers['X-Space-Id'] = spaceId;
    }

    const response = await fetch(`${API_BASE}/images`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(imageData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save image');
    }

    return await response.json();
}

// --- UI Helpers ---
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('save-status');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
}
