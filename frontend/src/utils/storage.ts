import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import type { Note } from "@/types/clip";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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

// --- Folders ---

export const getFolders = async (): Promise<Folder[]> => {
    const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
};

export const saveFolder = async (folder: Folder): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/folders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(folder),
    });
    if (!response.ok) throw new Error('Failed to save folder');
};

export const updateFolder = async (folder: Folder): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/folders/${folder.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(folder),
    });
    if (!response.ok) throw new Error('Failed to update folder');
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete folder');
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
    // No-op for API based storage, or check if default folders exist
    const folders = await getFolders();
    if (folders.length > 0) return;

    const predefinedFolders = [
        // Video Category
        { name: "Inspirations", category: "video" },
        { name: "Viral", category: "video" },
        { name: "Great Animations", category: "video" },
        { name: "AI Generated", category: "video" },
        // Image Category
        { name: "Inspirations", category: "image" },
        { name: "Ads", category: "image" },
        { name: "AI Generated", category: "image" },
    ];

    for (const f of predefinedFolders) {
        await saveFolder({
            id: uuidv4(),
            name: f.name,
            category: f.category as "video" | "image",
            parentId: null,
            createdAt: Date.now(),
        });
    }
}

