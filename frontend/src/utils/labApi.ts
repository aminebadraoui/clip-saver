import { API_URL } from "@/config";

const API_BASE_URL = API_URL;

export interface LibraryTemplate {
    id: string;
    text?: string;        // For titles
    description?: string; // For thumbnails
    structure?: string;   // For scripts
    category: string;
    createdAt: number;
    sources: {
        id: string;
        title: string;
        thumbnail: string;
    }[];
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('clipcoba_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

export const labApi = {
    // Fetch templates from the library
    async listTemplates(type: 'titles' | 'thumbnails' | 'scripts'): Promise<LibraryTemplate[]> {
        const response = await fetch(`${API_BASE_URL}/api/lab/libraries/${type}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`Failed to fetch ${type} library`);
        return response.json();
    }
};
