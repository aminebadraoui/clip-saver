// Popup is now just informational
document.addEventListener('DOMContentLoaded', () => {
    // Optional: Check auth status and show in popup
    chrome.storage.local.get(['authToken', 'tokenSource'], (result) => {
        const statusP = document.createElement('p');
        statusP.style.fontSize = '10px';
        statusP.style.marginTop = '10px';

        if (result.authToken) {
            statusP.style.color = 'green';
            if (result.tokenSource) {
                statusP.textContent = `✓ Token synced (${result.tokenSource})`;
            } else {
                statusP.style.color = 'orange';
                statusP.textContent = '✓ Token found (Legacy). Log In on App to update.';
            }
        } else {
            statusP.style.color = 'red';
            statusP.textContent = '⚠ No token found. Log in to Web App.';
        }

        document.body.appendChild(statusP);
    });
});
