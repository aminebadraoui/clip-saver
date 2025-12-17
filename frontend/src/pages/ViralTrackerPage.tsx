import { useState, useEffect } from "react";
import { fetchViralVideos } from "@/utils/youtubeAPI";
import type { ViralVideo, TimeFilter } from "@/types/youtube";
import { TimeFilterBar } from "@/components/TimeFilterBar";
import { ViralVideoCard } from "@/components/ViralVideoCard";
import { TrendingUp, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { TrendingKeywords } from "@/components/TrendingKeywords";
import { Skeleton } from "@/components/ui/skeleton";

export function ViralTrackerPage() {
    const [videos, setVideos] = useState<ViralVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<TimeFilter>("today");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadVideos(selectedFilter, debouncedQuery);
    }, [selectedFilter, debouncedQuery]);

    const loadVideos = async (filter: TimeFilter, query: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchViralVideos(filter, 50, query);
            setVideos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load videos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                    <TrendingUp className="w-10 h-10 text-primary" />
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        YouTube Viral Tracker
                    </h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Discover trending videos with the highest viral ratio (views per subscriber)
                </p>
            </div>

            {/* Search and Filter */}
            <div className="space-y-6">
                <div className="max-w-md mx-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search keywords (e.g., 'AI', 'Gaming', 'Tech')..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <TrendingKeywords onKeywordClick={setSearchQuery} />

                <TimeFilterBar
                    selectedFilter={selectedFilter}
                    onFilterChange={setSelectedFilter}
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Error Loading Videos</h3>
                        <p className="text-muted-foreground max-w-md">{error}</p>
                        {error.includes("API not configured") && (
                            <p className="text-sm text-muted-foreground mt-4">
                                Please set your YOUTUBE_API_KEY in the server/.env file
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Videos Grid */}
            {!loading && !error && videos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <ViralVideoCard key={video.videoId} video={video} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && videos.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                    <h3 className="text-xl font-medium text-muted-foreground mb-2">
                        No videos found
                    </h3>
                    <p className="text-muted-foreground">
                        Try selecting a different time period
                    </p>
                </div>
            )}
        </div>
    );
}
