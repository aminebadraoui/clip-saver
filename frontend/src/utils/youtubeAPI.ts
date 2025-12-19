import type { ViralVideo, TimeFilter, ViralVideosResponse } from "@/types/youtube";
import { API_URL } from "@/config";

const API_BASE_URL = `${API_URL}/api`;

export async function fetchViralVideos(
    timeFilter: TimeFilter,
    maxResults: number = 50,
    query?: string
): Promise<ViralVideo[]> {
    try {
        const queryParam = query ? `&q=${encodeURIComponent(query)}` : "";
        const response = await fetch(
            `${API_BASE_URL}/youtube/viral?timeFilter=${timeFilter}&maxResults=${maxResults}${queryParam}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to fetch viral videos");
        }

        const data: ViralVideosResponse = await response.json();
        return data.videos;
    } catch (error) {
        console.error("Error fetching viral videos:", error);
        throw error;
    }
}

export async function fetchTrendingKeywords(): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/youtube/trending-keywords`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to fetch trending keywords");
        }

        const data = await response.json();
        return data.keywords;
    } catch (error) {
        console.error("Error fetching trending keywords:", error);
        return [];
    }
}
