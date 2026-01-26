export interface Clip {
    id: string;
    type: 'video' | 'clip' | 'short';
    videoId: string;
    start?: number;
    end?: number;
    title: string;
    thumbnail: string;
    createdAt: number;

    tagIds?: string[];
    notes?: string;
    user_notes?: string;
    aiPrompt?: string;
    scriptOutline?: string;
    originalVideoUrl?: string;
    sourceVideoId?: string;
    originalTitle?: string;
    subscriberCount?: number;
    viewCount?: number;
    uploadDate?: string;
    viralRatio?: number;
    timeSinceUploadRatio?: number;
    transcript?: string;

    outlierScore?: number;
    engagementScore?: number;
    channelAverageViews?: number;
    spaceId?: string;
    notesList?: Note[];
    script_templates?: { id: string, structure: string }[];
    title_templates?: { id: string, text: string }[];
    thumbnail_templates?: { id: string, description: string }[];
}

export interface Note {
    id: string;
    content: string;
    category: 'video' | 'title' | 'thumbnail';
    createdAt: number;
    clip_id?: string;
    user_id?: string;
}
