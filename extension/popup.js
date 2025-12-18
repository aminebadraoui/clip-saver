document.addEventListener('DOMContentLoaded', () => {
    const statusContainer = document.getElementById('auth-status-container');
    const statusText = document.getElementById('auth-status-text');
    const statusSubtext = document.getElementById('auth-subtext');

    chrome.storage.local.get(['authToken', 'tokenSource'], (result) => {
        // Reset classes
        statusContainer.className = '';

        if (result.authToken) {
            statusContainer.classList.add('status-success');

            if (result.tokenSource) {
                statusText.textContent = 'Connected';
                statusSubtext.textContent = 'Ready to save clips.';
            } else {
                statusContainer.className = ''; // remove success, user warning style
                statusContainer.classList.add('status-warning');
                statusText.textContent = 'Legacy Token';
                statusSubtext.textContent = 'Please log in to the web app to update.';
            }
        } else {
            statusContainer.classList.add('status-error');
            statusText.textContent = 'Disconnected';
            statusSubtext.textContent = 'Log in to Clip Coba to start snapping.';
        }
    });
});
