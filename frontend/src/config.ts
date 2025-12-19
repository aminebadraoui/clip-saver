
const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Ensure HTTPS in production if not localhost
    if (import.meta.env.PROD && url.startsWith('http://') && !url.includes('localhost')) {
        url = url.replace('http://', 'https://');
    }

    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    return url;
};

export const API_URL = getApiUrl();
