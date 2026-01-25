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
    aiPrompt?: string;
    originalVideoUrl?: string;
    sourceVideoId?: string;
    originalTitle?: string;
    subscriberCount?: number;
    viewCount?: number;
    uploadDate?: string;
    viralRatio?: number;
    timeSinceUploadRatio?: number;

    outlierScore?: number;
    engagementScore?: number;
    channelAverageViews?: number;
    spaceId?: string;
    notesList?: Note[];
}

export interface Note {
    id: string;
    content: string;
    category: 'video' | 'title' | 'thumbnail';
    createdAt: number;
    clip_id?: string;
    user_id?: string;
}
