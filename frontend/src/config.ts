
const getApiUrl = () => {
    // 1. Hardcoded Override for Production Domain
    // This is the most critical check to fix mixed content errors.
    if (typeof window !== 'undefined' && window.location.hostname.includes('clipcoba.com')) {
        return 'https://api.clipcoba.com';
    }

    // 2. Standard Logic for Dev/Localhost
    let url = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Upgrade to HTTPS if PROD flag is set, just in case
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
