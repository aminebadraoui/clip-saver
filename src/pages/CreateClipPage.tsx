import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    const videoRef = useRef<HTMLVideoElement>(null);
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<{
        id: string;
        title: string;
        thumbnail: string;
        localUrl: string;
        filename: string;
    } | null>(null);

    const handleFetch = async () => {
        setError(null);
        setLoading(true);
        setVideoData(null); // Clear previous video data

        const videoId = getYouTubeId(url);
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

            setLoading(false);
            setDownloading(true);

            // Download video using yt-dlp
            const downloadResponse = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId }),
            });

            if (!downloadResponse.ok) {
                const errorData = await downloadResponse.json();
                throw new Error(errorData.error || 'Download failed');
            }

            const downloadData = await downloadResponse.json();

            setVideoData({
                id: videoId,
                title,
                thumbnail,
                localUrl: downloadData.url,
                filename: downloadData.filename,
            });
            setDownloading(false);
        } catch (err) {
            setError((err as Error).message || "An error occurred");
            setLoading(false);
            setDownloading(false);
        }
    };

    const handleSave = async (clips: Clip[]) => {
        clips.forEach((clip) => saveClip(clip));

        // Cleanup downloaded video
        if (videoData) {
            await fetch('/api/cleanup', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: videoData.filename }),
            });
        }

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
                            <Button onClick={handleFetch} disabled={loading || downloading || !url}>
                                {loading || downloading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {downloading ? "Downloading..." : "Loading..."}
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
                        <Card className="overflow-hidden bg-black">
                            <div className="aspect-video w-full flex items-center justify-center">
                                <video
                                    ref={videoRef}
                                    src={videoData.localUrl}
                                    controls
                                    className="w-full h-full"
                                />
                            </div>
                        </Card>

                        <SegmentBuilder
                            videoId={videoData.id}
                            videoTitle={videoData.title}
                            thumbnail={videoData.thumbnail}
                            videoRef={videoRef}
                            onSave={handleSave}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
