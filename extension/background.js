// Background service worker for Clip Coba extension
// Handles image saving coordination (context menu removed - now using hover button)

const API_BASE = "https://api.clipcoba.com/api";
// const API_BASE = "http://localhost:3001/api";

// Note: Context menu has been removed. Image saving is now handled via hover button in image-saver.js

async function handleImageSave(info, tab) {
    const imageUrl = info.srcUrl;
    const pageUrl = info.pageUrl || tab.url;

    console.log("ClipCoba: Saving image", imageUrl);

    // Get auth token from storage
    chrome.storage.local.get(['authToken', 'selectedSpaceId'], async (result) => {
        const token = result.authToken;
        const spaceId = result.selectedSpaceId;

        if (!token) {
            // Show notification to log in
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-128.png',
                title: 'ClipCoba',
                message: 'Please log in to ClipCoba to save images'
            });
            return;
        }

        try {
            // Extract domain from page URL
            const domain = new URL(pageUrl).hostname;

            // Create image title from URL or use domain
            const urlParts = imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const title = filename.split('?')[0] || `Image from ${domain}`;

            // Prepare image data
            const imageData = {
                title: title,
                image_url: imageUrl,
                source_url: pageUrl,
                thumbnail_url: imageUrl, // Use same URL for thumbnail
                tagIds: []
            };

            // Save to backend
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            if (spaceId) {
                headers['X-Space-Id'] = spaceId;
            }

            const response = await fetch(`${API_BASE}/images`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(imageData)
            });

            if (response.ok) {
                // Success notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-128.png',
                    title: 'ClipCoba',
                    message: 'Image saved to moodboard!'
                });
            } else if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await attemptTokenRefresh();
                if (refreshed) {
                    // Retry the save
                    handleImageSave(info, tab);
                } else {
                    throw new Error('Authentication failed');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save image');
            }
        } catch (error) {
            console.error('ClipCoba: Error saving image', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-128.png',
                title: 'ClipCoba Error',
                message: error.message || 'Failed to save image'
            });
        }
    });
}

async function attemptTokenRefresh() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['refreshToken'], async (result) => {
            const rToken = result.refreshToken;
            if (!rToken) {
                resolve(false);
                return;
            }

            try {
                const authUrl = API_BASE.replace('/api', '/auth/refresh');
                const response = await fetch(authUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: rToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    chrome.storage.local.set({ 'authToken': data.access_token });
                    console.log("ClipCoba: Token refreshed successfully");
                    resolve(true);
                } else {
                    console.warn("ClipCoba: Refresh failed", response.status);
                    resolve(false);
                }
            } catch (e) {
                console.error("ClipCoba: Refresh error", e);
                resolve(false);
            }
        });
    });
}
