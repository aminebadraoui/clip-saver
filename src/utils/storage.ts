import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";

const CLIPS_KEY = "yt_clips";
const FOLDERS_KEY = "yt_folders";
const TAGS_KEY = "yt_tags";

// --- Clips ---

export function getClips(): Clip[] {
    try {
        const json = localStorage.getItem(CLIPS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Failed to load clips", e);
        return [];
    }
}

export function saveClip(clip: Clip) {
    const clips = getClips();
    clips.unshift(clip); // Add to beginning
    localStorage.setItem(CLIPS_KEY, JSON.stringify(clips));
}

export function saveClips(newClips: Clip[]) {
    const clips = getClips();
    // Add new clips to the beginning
    const updatedClips = [...newClips, ...clips];
    localStorage.setItem(CLIPS_KEY, JSON.stringify(updatedClips));
}

export function deleteClip(id: string) {
    const clips = getClips();
    const updatedClips = clips.filter((c) => c.id !== id);
    localStorage.setItem(CLIPS_KEY, JSON.stringify(updatedClips));
}

export function updateClip(updatedClip: Clip) {
    const clips = getClips();
    const index = clips.findIndex((c) => c.id === updatedClip.id);
    if (index !== -1) {
        clips[index] = updatedClip;
        localStorage.setItem(CLIPS_KEY, JSON.stringify(clips));
    }
}

// --- Folders ---

export function getFolders(): Folder[] {
    try {
        const json = localStorage.getItem(FOLDERS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Failed to load folders", e);
        return [];
    }
}

export function saveFolder(folder: Folder) {
    const folders = getFolders();
    folders.push(folder);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function updateFolder(updatedFolder: Folder) {
    const folders = getFolders();
    const index = folders.findIndex((f) => f.id === updatedFolder.id);
    if (index !== -1) {
        folders[index] = updatedFolder;
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }
}

export function deleteFolder(id: string) {
    const folders = getFolders();
    // Recursively find all subfolder IDs to delete
    const idsToDelete = new Set<string>();
    const findChildren = (parentId: string) => {
        idsToDelete.add(parentId);
        folders.filter(f => f.parentId === parentId).forEach(child => findChildren(child.id));
    };
    findChildren(id);

    const updatedFolders = folders.filter((f) => !idsToDelete.has(f.id));
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));

    // Also move clips in these folders to root (or delete? let's move to root for safety)
    const clips = getClips();
    let clipsChanged = false;
    const updatedClips = clips.map(clip => {
        if (clip.folderId && idsToDelete.has(clip.folderId)) {
            clipsChanged = true;
            return { ...clip, folderId: null };
        }
        return clip;
    });

    if (clipsChanged) {
        localStorage.setItem(CLIPS_KEY, JSON.stringify(updatedClips));
    }
}

// --- Tags ---

import { v4 as uuidv4 } from "uuid";

export function getTags(): Tag[] {
    try {
        const json = localStorage.getItem(TAGS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Failed to load tags", e);
        return [];
    }
}

export function saveTag(tag: Tag) {
    const tags = getTags();
    tags.push(tag);
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

export function deleteTag(id: string) {
    const tags = getTags();
    const updatedTags = tags.filter((t) => t.id !== id);
    localStorage.setItem(TAGS_KEY, JSON.stringify(updatedTags));

    // Remove this tag from all clips
    const clips = getClips();
    let clipsChanged = false;
    const updatedClips = clips.map(clip => {
        if (clip.tagIds && clip.tagIds.includes(id)) {
            clipsChanged = true;
            return { ...clip, tagIds: clip.tagIds.filter(tid => tid !== id) };
        }
        return clip;
    });

    if (clipsChanged) {
        localStorage.setItem(CLIPS_KEY, JSON.stringify(updatedClips));
    }
}

export function initializeFolders() {
    const initialized = localStorage.getItem("yt_initialized");
    if (initialized) return;

    const folders = getFolders();
    if (folders.length > 0) {
        localStorage.setItem("yt_initialized", "true");
        return;
    }

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

    const newFolders: Folder[] = predefinedFolders.map(f => ({
        id: uuidv4(),
        name: f.name,
        category: f.category as "video" | "image",
        parentId: null,
        createdAt: Date.now(),
    }));

    localStorage.setItem(FOLDERS_KEY, JSON.stringify(newFolders));
    localStorage.setItem("yt_initialized", "true");
}

