import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getYouTubeId } from "@/utils/getYouTubeId";
import { saveClip } from "@/utils/storage";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Clip } from "@/types/clip";

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

    // Auto-fetch if URL is provided in query params
    useEffect(() => {
        const queryUrl = searchParams.get("url");
        if (queryUrl && !videoData && !loading) {
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

    const handleSave = async (clips: Clip[]) => {
        clips.forEach((clip) => saveClip(clip));
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

                {videoData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SegmentBuilder
                            videoId={videoData.id}
                            videoTitle={videoData.title}
                            thumbnail={videoData.thumbnail}
                            onSave={handleSave}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
