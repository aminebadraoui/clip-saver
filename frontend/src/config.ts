const getApiUrl = () => {
    // Standard Logic: Rely on VITE_API_URL provided by the build environment
    let url = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Upgrade to HTTPS if PROD flag is set, just in case (optional safety)
    if (import.meta.env.PROD && url.startsWith('http://') && !url.includes('localhost')) {
        url = url.replace('http://', 'https://');
    }

    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    console.log("Config: Determined API_URL as:", url);
    return url;
};

export const API_URL = getApiUrl();
