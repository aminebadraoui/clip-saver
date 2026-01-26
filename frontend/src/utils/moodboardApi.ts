const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3001/api";

export interface Moodboard {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    user_id: string;
    space_id: string;
}

export interface MoodboardCreateData {
    name: string;
    description?: string;
    space_id: string;
}

export async function fetchMoodboards(
    token: string,
    spaceId?: string
): Promise<Moodboard[]> {
    const url = new URL(`${API_BASE}/moodboards`);
    if (spaceId) {
        url.searchParams.append('space_id', spaceId);
    }

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch moodboards');
    }

    return response.json();
}

export async function createMoodboard(
    token: string,
    data: MoodboardCreateData
): Promise<Moodboard> {
    const response = await fetch(`${API_BASE}/moodboards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create moodboard');
    }

    return response.json();
}

export async function updateMoodboard(
    token: string,
    id: string,
    data: { name?: string; description?: string }
): Promise<Moodboard> {
    const response = await fetch(`${API_BASE}/moodboards/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update moodboard');
    }

    return response.json();
}

export async function deleteMoodboard(
    token: string,
    id: string
): Promise<void> {
    const response = await fetch(`${API_BASE}/moodboards/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete moodboard');
    }
}
