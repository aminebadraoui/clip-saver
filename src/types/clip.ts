export interface Clip {
    id: string;
    type: 'video' | 'clip';
    videoId: string;
    start?: number;
    end?: number;
    title: string;
    thumbnail: string;
    createdAt: number;
    folderId?: string | null;
    tagIds?: string[];
    notes?: string;
    aiPrompt?: string;
    originalVideoUrl?: string;
    sourceVideoId?: string;
}
