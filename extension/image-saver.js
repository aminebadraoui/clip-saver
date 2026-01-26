// Image saver content script - runs on all websites
// Provides hover button UI for saving images to moodboards

console.log("ClipCoba: Image saver loaded");

const API_BASE = "https://api.clipcoba.com/api";
// const API_BASE = "http://localhost:3001/api";

let currentToken = null;
let availableSpaces = [];
let availableMoodboards = [];
let currentHoverButton = null;
let currentDropdown = null;

// Sync auth token from storage
const syncToken = () => {
    chrome.storage.local.get(['authToken', 'refreshToken'], (result) => {
        currentToken = result.authToken || null;
        console.log('ClipCoba Image Saver: Token synced', currentToken ? 'Token present' : 'No token');
        if (currentToken) {
            fetchSpaces();
        }
    });
};
syncToken();
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.authToken || changes.refreshToken)) {
        syncToken();
    }
});

// Fetch spaces
async function fetchSpaces() {
    if (!currentToken) {
        console.log('ClipCoba Image Saver: No token available for fetching spaces');
        return;
    }
    try {
        console.log('ClipCoba Image Saver: Fetching spaces...');
        const response = await fetch(`${API_BASE}/spaces/`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (response.ok) {
            availableSpaces = await response.json();
            console.log('ClipCoba Image Saver: Spaces loaded:', availableSpaces.length);
        } else {
            console.error('ClipCoba Image Saver: Failed to fetch spaces:', response.status);
        }
    } catch (e) {
        console.error("ClipCoba Image Saver: Error fetching spaces", e);
    }
}

// Fetch moodboards for a specific space
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

// Save image to moodboard
async function saveImage(imageUrl, pageUrl, spaceId, moodboardId) {
    if (!currentToken) {
        throw new Error("Not authenticated");
    }

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

// Create hover button
function createHoverButton(img) {
    // Remove any existing button
    removeHoverButton();

    const button = document.createElement('div');
    button.className = 'clipcoba-save-button';
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Save</span>
    `;

    // Position the button
    const rect = img.getBoundingClientRect();
    button.style.position = 'fixed';
    button.style.top = `${rect.top + 10}px`;
    button.style.right = `${window.innerWidth - rect.right + 10}px`;
    button.style.zIndex = '999999';

    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showDropdown(img, button);
    };

    document.body.appendChild(button);
    currentHoverButton = button;

    return button;
}

// Remove hover button
function removeHoverButton() {
    if (currentHoverButton) {
        currentHoverButton.remove();
        currentHoverButton = null;
    }
}

// Remove dropdown
function removeDropdown() {
    if (currentDropdown) {
        currentDropdown.remove();
        currentDropdown = null;
    }
}

// Show dropdown
async function showDropdown(img, button) {
    removeDropdown();

    if (!currentToken) {
        alert("Please log in to ClipCoba to save images");
        return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'clipcoba-dropdown';

    const rect = button.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.right = `${window.innerWidth - rect.right}px`;
    dropdown.style.zIndex = '1000000';

    dropdown.innerHTML = `
        <div class="clipcoba-dropdown-header">
            <span>Save to Moodboard</span>
            <button class="clipcoba-close-btn">&times;</button>
        </div>
        <div class="clipcoba-dropdown-body">
            <label>Space:</label>
            <select id="clipcoba-space-select" class="clipcoba-select">
                <option value="">Select a space...</option>
            </select>
            
            <label>Moodboard:</label>
            <select id="clipcoba-moodboard-select" class="clipcoba-select" disabled>
                <option value="">Select a space first...</option>
            </select>
            
            <button id="clipcoba-save-btn" class="clipcoba-save-btn" disabled>Save Image</button>
            <div id="clipcoba-status" class="clipcoba-status"></div>
        </div>
    `;

    document.body.appendChild(dropdown);
    currentDropdown = dropdown;

    // Populate spaces
    const spaceSelect = dropdown.querySelector('#clipcoba-space-select');
    const moodboardSelect = dropdown.querySelector('#clipcoba-moodboard-select');
    const saveBtn = dropdown.querySelector('#clipcoba-save-btn');
    const statusDiv = dropdown.querySelector('#clipcoba-status');
    const closeBtn = dropdown.querySelector('.clipcoba-close-btn');

    availableSpaces.forEach(space => {
        const option = document.createElement('option');
        option.value = space.id;
        option.textContent = space.name;
        spaceSelect.appendChild(option);
    });

    // Space selection handler
    spaceSelect.onchange = async () => {
        const spaceId = spaceSelect.value;
        moodboardSelect.innerHTML = '<option value="">Loading...</option>';
        moodboardSelect.disabled = true;
        saveBtn.disabled = true;

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
        }
    };

    // Moodboard selection handler
    moodboardSelect.onchange = () => {
        saveBtn.disabled = !moodboardSelect.value;
    };

    // Save button handler
    saveBtn.onclick = async () => {
        const spaceId = spaceSelect.value;
        const moodboardId = moodboardSelect.value;

        if (!spaceId || !moodboardId) {
            statusDiv.textContent = "Please select both space and moodboard";
            statusDiv.className = "clipcoba-status error";
            return;
        }

        statusDiv.textContent = "Saving...";
        statusDiv.className = "clipcoba-status";
        saveBtn.disabled = true;

        try {
            await saveImage(img.src, window.location.href, spaceId, moodboardId);
            statusDiv.textContent = "✓ Saved!";
            statusDiv.className = "clipcoba-status success";

            setTimeout(() => {
                removeDropdown();
                removeHoverButton();
            }, 1500);
        } catch (error) {
            statusDiv.textContent = error.message || "Failed to save";
            statusDiv.className = "clipcoba-status error";
            saveBtn.disabled = false;
        }
    };

    // Close button handler
    closeBtn.onclick = () => {
        removeDropdown();
    };

    // Click outside to close
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !button.contains(e.target)) {
                removeDropdown();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// Track mouse over images
let hoverTimeout = null;
let currentHoveredImage = null;

document.addEventListener('mouseover', (e) => {
    const img = e.target.closest('img');

    if (img && img !== currentHoveredImage) {
        // Clear any existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        currentHoveredImage = img;

        // Show button after 500ms hover
        hoverTimeout = setTimeout(() => {
            // Check if image is large enough (at least 100x100)
            if (img.naturalWidth >= 100 && img.naturalHeight >= 100) {
                createHoverButton(img);
            }
        }, 500);
    }
}, true);

document.addEventListener('mouseout', (e) => {
    const img = e.target.closest('img');

    if (img === currentHoveredImage) {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }

        // Don't remove button immediately - let user move to it
        setTimeout(() => {
            if (currentHoverButton && !currentDropdown) {
                const buttonRect = currentHoverButton.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                // Check if mouse is near the button
                const isNearButton =
                    mouseX >= buttonRect.left - 20 &&
                    mouseX <= buttonRect.right + 20 &&
                    mouseY >= buttonRect.top - 20 &&
                    mouseY <= buttonRect.bottom + 20;

                if (!isNearButton) {
                    removeHoverButton();
                }
            }
        }, 300);

        currentHoveredImage = null;
    }
}, true);

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .clipcoba-save-button {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #dc2626;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        transition: all 0.2s;
        user-select: none;
    }

    .clipcoba-save-button:hover {
        background: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
    }

    .clipcoba-save-button svg {
        width: 16px;
        height: 16px;
    }

    .clipcoba-dropdown {
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        min-width: 280px;
        font-family: system-ui, -apple-system, sans-serif;
        overflow: hidden;
    }

    .clipcoba-dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 600;
        font-size: 14px;
        color: #111827;
    }

    .clipcoba-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .clipcoba-close-btn:hover {
        background: #e5e7eb;
        color: #111827;
    }

    .clipcoba-dropdown-body {
        padding: 16px;
    }

    .clipcoba-dropdown-body label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
        margin-top: 12px;
    }

    .clipcoba-dropdown-body label:first-child {
        margin-top: 0;
    }

    .clipcoba-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 13px;
        color: #111827;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }

    .clipcoba-select:hover:not(:disabled) {
        border-color: #dc2626;
    }

    .clipcoba-select:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .clipcoba-select:disabled {
        background: #f9fafb;
        color: #9ca3af;
        cursor: not-allowed;
    }

    .clipcoba-save-btn {
        width: 100%;
        padding: 10px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 16px;
        transition: all 0.2s;
    }

    .clipcoba-save-btn:hover:not(:disabled) {
        background: #b91c1c;
    }

    .clipcoba-save-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
    }

    .clipcoba-status {
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        text-align: center;
        display: none;
    }

    .clipcoba-status:not(:empty) {
        display: block;
    }

    .clipcoba-status.success {
        background: #d1fae5;
        color: #065f46;
    }

    .clipcoba-status.error {
        background: #fee2e2;
        color: #991b1b;
    }
`;
document.head.appendChild(style);
