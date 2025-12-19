
const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Ensure HTTPS in production or if domain matches production domain
    if ((import.meta.env.PROD || url.includes('clipcoba.com')) && url.startsWith('http://') && !url.includes('localhost')) {
        url = url.replace('http://', 'https://');
    }

    // Force API URL to be https://api.clipcoba.com if we are on the production domain (client side check)
    if (typeof window !== 'undefined' && window.location.hostname.includes('clipcoba.com')) {
        if (url.includes('localhost') || url.startsWith('http://api.clipcoba.com')) {
            url = 'https://api.clipcoba.com';
        }
    }

    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    return url;
};

export const API_URL = getApiUrl();
