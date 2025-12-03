import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getYouTubeId } from "@/utils/getYouTubeId";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SaveClipModal } from "@/components/SaveClipModal";
import { getFolders, getTags, getClips, saveClips } from "@/utils/storage";
import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";

export function CreateClipPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [url, setUrl] = useState(searchParams.get("url") || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<{
        id: string;
        title: string;
        thumbnail: string;
    } | null>(null);

    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [clipsToSave, setClipsToSave] = useState<Clip[]>([]);

    useEffect(() => {
        setFolders(getFolders());
        setTags(getTags());
    }, []);

    // Auto-fetch if URL is provided in query params or source ID
    useEffect(() => {
        const queryUrl = searchParams.get("url");
        const sourceId = searchParams.get("source");

        if (sourceId) {
            const allClips = getClips();
            const sourceClip = allClips.find(c => c.id === sourceId);
            if (sourceClip) {
                setVideoData({
                    id: sourceClip.videoId,
                    title: sourceClip.title,
                    thumbnail: sourceClip.thumbnail,
                });
                // If it's a clip, maybe we should pre-fill start/end? 
                // But SegmentBuilder expects videoId.
                // If source is a video, we just load it.
            }
        } else if (queryUrl && !videoData && !loading) {
            handleFetch(queryUrl);
        }
    }, []); // Run once on mount

    const handleFetch = async (inputUrl?: string) => {
        const urlToFetch = inputUrl || url;

        setError(null);
        setLoading(true);
        setVideoData(null);

        const videoId = getYouTubeId(urlToFetch);
        if (!videoId) {
            setError("Invalid YouTube URL. Please check and try again.");
            setLoading(false);
            return;
        }

        try {
            // Fetch metadata
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            if (!response.ok) throw new Error("Failed to fetch video metadata");

            const data = await response.json();
            const title = data.title || "Unknown Title";
            const thumbnail = data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            setVideoData({
                id: videoId,
                title,
                thumbnail,
            });
        } catch (err) {
            setError((err as Error).message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = (clips: Clip[]) => {
        setClipsToSave(clips);
        setIsSaveModalOpen(true);
    };

    const handleModalSave = (metadata: any) => {
        const clipsWithMetadata = clipsToSave.map(clip => ({
            ...clip,
            ...metadata,
            type: 'clip' as const, // Ensure type is clip
            sourceVideoId: searchParams.get("source") || undefined,
            originalVideoUrl: url || undefined,
        }));

        saveClips(clipsWithMetadata);
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clips
                </Button>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold">Create New Clip</h1>
                    <p className="text-muted-foreground">
                        Paste a YouTube URL to get started
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                            />
                            <Button onClick={() => handleFetch()} disabled={loading || !url}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Fetch Video"
                                )}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Debug Info */}
                <div className="p-4 bg-muted rounded text-xs font-mono">
                    <p>URL: {url}</p>
                    <p>Loading: {loading.toString()}</p>
                    <p>Error: {error}</p>
                    <p>VideoData: {JSON.stringify(videoData)}</p>
                </div>

                {videoData && (
                    <div className="space-y-6">
                        <SegmentBuilder
                            videoId={videoData.id}
                            videoTitle={videoData.title}
                            thumbnail={videoData.thumbnail}
                            onSave={handleSave}
                        />
                    </div>
                )}
            </div>

            <SaveClipModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleModalSave}
                folders={folders}
                tags={tags}
                clips={clipsToSave}
            />
        </div>
    );
}
