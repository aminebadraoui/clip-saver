console.log("Clip Coba: Auth Sync Script Loaded");

let syncInterval;

function syncToken() {
    try {
        // Check if extension context is valid
        if (!chrome.runtime?.id) {
            throw new Error("Extension context invalidated");
        }

        const token = localStorage.getItem('clipcoba_token');
        if (token) {
            chrome.storage.local.set({ 'authToken': token }, () => {
                if (chrome.runtime.lastError) {
                    // Context might have died during set
                    console.warn("Clip Coba: Context lost during sync");
                    clearInterval(syncInterval);
                }
            });
        } else {
            chrome.storage.local.remove('authToken', () => {
                if (chrome.runtime.lastError) clearInterval(syncInterval);
            });
        }
    } catch (e) {
        if (e.message.includes("Extension context invalidated")) {
            console.log("Clip Coba: Extension reloaded. Stopping old sync script.");
            clearInterval(syncInterval);
        } else {
            console.error("Clip Coba Sync Error:", e);
        }
    }
}

// Sync immediately
syncToken();

// Listen for storage changes (login/logout)
window.addEventListener('storage', (e) => {
    if (e.key === 'clipcoba_token') {
        syncToken();
    }
});

// Periodic check
syncInterval = setInterval(syncToken, 5000);
