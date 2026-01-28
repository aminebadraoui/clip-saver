const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3001/api";

export interface BrainstormedTitle {
    text: string; // Backend returns 'text'
    score?: number;
    explanation?: string;
    id?: string;
}

export interface BrainstormedThumbnail {
    description: string;
    score?: number;
    explanation?: string;
}

export interface VideoIdeation {
    id: string;
    projectName: string;
    mainIdea?: string;
    createdAt: number;
    updatedAt: number;
    user_id: string;
    space_id: string;
    targetAudience?: string;
    visualVibe?: string;

    // Content fields
    brainstormedTitles?: string; // JSON string
    brainstormedThumbnails?: string; // JSON string
    scriptOutline?: string;
    scriptContent?: string;
}

export async function fetchIdeations(
    token: string,
    spaceId?: string
): Promise<VideoIdeation[]> {
    const url = new URL(`${API_BASE}/ideation/`);

    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
    };

    if (spaceId) {
        headers['X-Space-Id'] = spaceId;
    }

    const response = await fetch(url.toString(), {
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch ideations');
    }

    return response.json();
}
