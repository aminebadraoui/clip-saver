import type { Clip } from "@/types/clip";

const STORAGE_KEY = "yt_clips";

export function getClips(): Clip[] {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error("Failed to load clips", e);
        return [];
    }
}

export function saveClip(clip: Clip) {
    const clips = getClips();
    clips.unshift(clip); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
}

export function saveClips(newClips: Clip[]) {
    const clips = getClips();
    // Add new clips to the beginning
    const updatedClips = [...newClips, ...clips];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClips));
}

export function deleteClip(id: string) {
    const clips = getClips();
    const updatedClips = clips.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClips));
}
