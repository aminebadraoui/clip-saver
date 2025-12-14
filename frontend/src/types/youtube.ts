export interface ViralVideo {
    videoId: string;
    title: string;
    thumbnail: string;
    channelName: string;
    channelId: string;
    viewCount: number;
    subscriberCount: number;
    viralRatio: number;
    publishedAt: string;
    url: string;
}

export type TimeFilter = "hour" | "today" | "week" | "month" | "year";

export interface ViralVideosResponse {
    videos: ViralVideo[];
}
