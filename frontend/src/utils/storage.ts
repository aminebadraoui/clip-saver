import type { Clip } from "@/types/clip";

import type { Tag } from "@/types/tag";
import type { Note } from "@/types/clip";


import { API_URL } from "@/config";


const API_BASE_URL = `${API_URL}/api`;

export const getHeaders = () => {
    const token = localStorage.getItem('clipcoba_token');
    const spaceId = localStorage.getItem('clipcoba_space_id');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(spaceId ? { 'X-Space-Id': spaceId } : {})
    };
};

// --- Clips ---

export const getClips = async (): Promise<Clip[]> => {
    const response = await fetch(`${API_BASE_URL}/clips`, {
        headers: getHeaders()
    });
    if (!response.ok) {
        if (response.status === 401) {
            // Optional: Redirect to login or handle globally
            throw new Error("Unauthorized");
        }
        throw new Error('Failed to fetch clips');
    }
    return response.json();
};

export const saveClip = async (clip: Clip): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clips`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(clip),
    });
    if (!response.ok) throw new Error('Failed to save clip');
};

export const saveClips = async (clips: Clip[]): Promise<void> => {
    // Backend only supports single clip creation for now, loop it
    for (const clip of clips) {
        await saveClip(clip);
    }
};

export const deleteClip = async (clipId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clips/${clipId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete clip');
};

export const updateClip = async (clip: Clip): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clips/${clip.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(clip),
    });
    if (!response.ok) throw new Error('Failed to update clip');
};



// --- Tags ---

export const getTags = async (): Promise<Tag[]> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
};

export const saveTag = async (tag: Tag): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tag),
    });
    if (!response.ok) throw new Error('Failed to save tag');
};

export const deleteTag = async (tagId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete tag');
};

// --- Notes ---

export const saveNote = async (clipId: string, content: string, category: string): Promise<Note> => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ clip_id: clipId, content, category }),
    });
    if (!response.ok) throw new Error('Failed to save note');
    return response.json();
};

export const deleteNote = async (noteId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete note');
};

export const initializeFolders = async (): Promise<void> => {
    // Deprecated: No more folders.
}

