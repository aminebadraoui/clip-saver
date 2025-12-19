import { toast } from "sonner";
import { API_URL } from "@/config";

export interface VideoDetails {
    title: string;
    thumbnail: string;
    videoId: string;
    viewCount?: number;
    subscriberCount?: number;
    uploadDate?: string;
    viralRatio?: number;
    timeRatio?: number;
    engagementScore?: number;
}

export const extractVideoId = (inputUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const fetchVideoDetails = async (url: string): Promise<VideoDetails | null> => {
    const id = extractVideoId(url);
    if (!id) {
        toast.error("Invalid YouTube URL");
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/info?videoId=${id}`);
        if (!response.ok) throw new Error("Failed to fetch video info");

        const data = await response.json();

        // Calculate Metrics
        let vRatioRaw: number | undefined;
        let vRatioNorm: number | undefined;
        let tRatio: number | undefined;
        let eScore: number | undefined;

        if (data.viewCount && data.subscriberCount) {
            vRatioRaw = data.viewCount / data.subscriberCount;
            // Normalize to 0-10 scale
            vRatioNorm = Math.min(10, Math.max(0, (Math.log10(Math.max(vRatioRaw, 0.0001)) + 2) * 2.5));
        }

        if (data.viewCount && data.uploadDate) {
            const year = parseInt(data.uploadDate.substring(0, 4));
            const month = parseInt(data.uploadDate.substring(4, 6)) - 1;
            const day = parseInt(data.uploadDate.substring(6, 8));
            const uploadDt = new Date(year, month, day);
            const daysSince = Math.max(1, (new Date().getTime() - uploadDt.getTime()) / (1000 * 3600 * 24));
            const rawVelocity = data.viewCount / daysSince;
            // Normalize to 0-10 scale
            tRatio = Math.min(10, (Math.log10(rawVelocity + 1) / 5) * 10);
        }

        if (vRatioNorm !== undefined && tRatio !== undefined) {
            eScore = (vRatioNorm + tRatio) / 2;
        }

        return {
            title: data.title,
            thumbnail: data.thumbnail,
            videoId: id,
            viewCount: data.viewCount,
            subscriberCount: data.subscriberCount,
            uploadDate: data.uploadDate,
            viralRatio: vRatioRaw,
            timeRatio: tRatio,
            engagementScore: eScore
        };

    } catch (error) {
        console.error(error);
        toast.error("Failed to load video details.");
        return null;
    }
};
