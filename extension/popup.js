// Popup is now just informational
document.addEventListener('DOMContentLoaded', () => {
    // Optional: Check auth status and show in popup
    chrome.storage.local.get(['authToken'], (result) => {
        const statusP = document.createElement('p');
        statusP.style.fontSize = '10px';
        statusP.style.marginTop = '10px';
        statusP.style.color = result.authToken ? 'green' : 'red';
        statusP.textContent = result.authToken ? '✓ Token synced' : '⚠ No token found. Log in to Web App.';
        document.body.appendChild(statusP);
    });
});
