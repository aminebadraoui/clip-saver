const SOURCES = {
    'localhost': 'Local',
    '127.0.0.1': 'Local',
    'dev.clipcoba.com': 'Dev',
    'www.clipcoba.com': 'Prod',
    'clipcoba.com': 'Prod'
};

const currentHost = window.location.hostname;
// Use precise matching preventing substring issues (e.g. dev.clipcoba.com including clipcoba.com)
let currentSource = 'Unknown';
if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    currentSource = 'Local';
} else if (currentHost === 'dev.clipcoba.com') {
    currentSource = 'Dev';
} else if (currentHost === 'clipcoba.com' || currentHost === 'www.clipcoba.com') {
    currentSource = 'Prod';
}


console.log(`Clip Coba: Auth Sync Script Loaded for ${currentSource} (${currentHost})`);

let syncInterval;

function syncToken() {
    try {
        if (!chrome.runtime?.id) {
            throw new Error("Extension context invalidated");
        }

        const token = localStorage.getItem('clipcoba_token') || localStorage.getItem('token');

        if (token) {
            // WE found a token on this page, so WE take authority
            chrome.storage.local.set({
                'authToken': token,
                'tokenSource': currentSource
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn("Clip Coba: Context lost during set");
                    clearInterval(syncInterval);
                }
            });
        } else {
            // NO token found here (logged out or never logged in)
            // ONLY remove if WE were the ones who set it
            chrome.storage.local.get(['tokenSource'], (result) => {
                if (chrome.runtime.lastError) return;

                if (result.tokenSource === currentSource) {
                    // We set it, so we can clear it
                    console.log(`Clip Coba: Clearing token from ${currentSource}`);
                    chrome.storage.local.remove(['authToken', 'tokenSource'], () => {
                        if (chrome.runtime.lastError) clearInterval(syncInterval);
                    });
                } else {
                    // Someone else set it, or it's empty. Leave it alone.
                    // console.log(`Clip Coba: Ignoring missing token on ${currentSource} (owned by ${result.tokenSource})`);
                }
            });
        }
    } catch (e) {
        if (e.message?.includes("Extension context invalidated")) {
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
    if (e.key === 'clipcoba_token' || e.key === 'token') {
        syncToken();
    }
});

// Sync immediately on focus or visibility change (fixes background tab throttling)
window.addEventListener('focus', syncToken);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncToken();
});

// Periodic check
syncInterval = setInterval(syncToken, 5000);
