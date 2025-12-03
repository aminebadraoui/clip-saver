import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/utils/formatTime";
import { Trash2, Plus, Save, Play, Pause, Loader2 } from "lucide-react";
import type { Clip } from "@/types/clip";

interface Segment {
    id: string;
    start: string;
    end: string;
    thumbnail?: string | null;
    isGeneratingThumbnail?: boolean;
}

interface SegmentBuilderProps {
    videoId: string;
    videoTitle: string;
    thumbnail: string;
    onSave: (clips: Clip[]) => void;
}

export function SegmentBuilder({ videoId, videoTitle, thumbnail, onSave }: SegmentBuilderProps) {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sliderValue, setSliderValue] = useState([0, 0]);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const playerRef = useRef<YouTubePlayer | null>(null);
    const previewIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onPlayerReady = (event: YouTubeEvent) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
    };

    const onStateChange = (event: YouTubeEvent) => {
        setIsPlaying(event.data === 1); // 1 is playing
    };

    // Sync slider with inputs
    useEffect(() => {
        const s = parseInt(start) || 0;
        const e = parseInt(end) || 0;
        setSliderValue([s, e]);
    }, [start, end]);

    const handleSliderChange = (value: number[]) => {
        const prevStart = sliderValue[0];
        const prevEnd = sliderValue[1];

        setSliderValue(value);
        setStart(value[0].toString());
        setEnd(value[1].toString());

        if (playerRef.current) {
            // Determine which thumb was moved and seek accordingly
            if (value[0] !== prevStart) {
                playerRef.current.seekTo(value[0], true);
            } else if (value[1] !== prevEnd) {
                playerRef.current.seekTo(value[1], true);
            }
        }
    };

    const previewSegment = () => {
        if (!playerRef.current) return;

        const s = parseInt(start);
        const e = parseInt(end);

        if (!isNaN(s) && !isNaN(e) && s < e) {
            playerRef.current.seekTo(s, true);
            playerRef.current.playVideo();

            // Clear existing interval
            if (previewIntervalRef.current) {
                clearInterval(previewIntervalRef.current);
            }

            // Stop at end time
            previewIntervalRef.current = setInterval(async () => {
                if (!playerRef.current) return;
                const currentTime = await playerRef.current.getCurrentTime();

                if (currentTime >= e) {
                    playerRef.current.pauseVideo();
                    if (previewIntervalRef.current) {
                        clearInterval(previewIntervalRef.current);
                    }
                }
            }, 100);
        }
    };

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (previewIntervalRef.current) {
                clearInterval(previewIntervalRef.current);
            }
        };
    }, []);

    const addSegment = () => {
        console.log("DEBUG: addSegment called", { start, end });
        setError(null);
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (isNaN(startNum) || isNaN(endNum)) {
            console.log("DEBUG: Invalid numbers");
            setError("Start and end times must be valid numbers (seconds).");
            return;
        }

        if (startNum < 0 || endNum < 0) {
            setError("Time cannot be negative.");
            return;
        }

        if (startNum >= endNum) {
            setError("Start time must be less than end time.");
            return;
        }

        // Optional: Check overlap
        const hasOverlap = segments.some(seg => {
            const s = parseInt(seg.start);
            const e = parseInt(seg.end);
            return (startNum >= s && startNum < e) || (endNum > s && endNum <= e) || (startNum <= s && endNum >= e);
        });

        if (hasOverlap) {
            setError("This segment overlaps with an existing one.");
            return;
        }

        console.log("DEBUG: Validation passed, creating segment...");
        // Optimistic update
        const tempId = uuidv4();
        const newSegment: Segment = {
            id: tempId,
            start: start,
            end: end,
            thumbnail: null, // Will be updated
        };

        setSegments([...segments, newSegment]);
        setStart("");
        setEnd("");
        setSliderValue([0, 0]);

        // Trigger server-side capture
        console.log("DEBUG: Sending capture request...", { videoId, timestamp: startNum });
        fetch('/api/capture-thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoId,
                timestamp: startNum
            })
        })
            .then(async res => {
                console.log("DEBUG: Capture response status:", res.status);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Server error: ${res.status} ${text}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("DEBUG: Capture success:", data);
                if (data.url) {
                    setSegments(prev => prev.map(s =>
                        s.id === tempId
                            ? { ...s, thumbnail: data.url }
                            : s
                    ));
                } else {
                    // Fallback to smart thumbnail if capture fails
                    setSegments(prev => prev.map(s =>
                        s.id === tempId
                            ? { ...s, thumbnail: getSmartThumbnail(startNum) }
                            : s
                    ));
                }
            })
            .catch(err => {
                console.error("DEBUG: Thumbnail capture failed:", err);
                // Fallback
                setSegments(prev => prev.map(s =>
                    s.id === tempId
                        ? { ...s, thumbnail: getSmartThumbnail(startNum) }
                        : s
                ));
            });
    };

    const removeSegment = (id: string) => {
        setSegments(segments.filter((s) => s.id !== id));
    };

    const getSmartThumbnail = (start: number) => {
        // Use standard YouTube thumbnails
        // 0 = default (480x360), 1, 2, 3 = generated thumbnails
        // hqdefault = 480x360
        // mqdefault = 320x180
        // default = 120x90

        // We can try to pick one of the 3 generated thumbnails based on start time relative to duration
        // But since we don't know exact duration until player loads, and we want this to be simple
        // Let's just use the high quality default for now, or maybe try to map to 1/2/3 if we have duration

        if (duration > 0) {
            const ratio = start / duration;
            if (ratio < 0.33) return `https://img.youtube.com/vi/${videoId}/1.jpg`;
            if (ratio < 0.66) return `https://img.youtube.com/vi/${videoId}/2.jpg`;
            return `https://img.youtube.com/vi/${videoId}/3.jpg`;
        }

        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    };

    const handleSave = () => {
        if (segments.length === 0) return;

        const clips: Clip[] = segments.map((seg) => {
            const startSeconds = parseInt(seg.start);
            return {
                id: uuidv4(),
                videoId,
                title: videoTitle,
                thumbnail: seg.thumbnail || thumbnail,
                start: startSeconds,
                end: parseInt(seg.end),
                createdAt: Date.now(),
            };
        });

        onSave(clips);
    };

    return (
        <div className="space-y-6">
            {/* YouTube Player */}
            <Card className="overflow-hidden bg-black">
                <div className="aspect-video w-full flex items-center justify-center">
                    <YouTube
                        videoId={videoId}
                        className="w-full h-full"
                        iframeClassName="w-full h-full"
                        onReady={onPlayerReady}
                        onStateChange={onStateChange}
                        opts={{
                            playerVars: {
                                autoplay: 1,
                                controls: 1,
                                rel: 0,
                                showinfo: 0,
                            },
                        }}
                    />
                </div>
            </Card>

            <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>00:00</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <Slider
                    defaultValue={[0, 0]}
                    value={sliderValue}
                    max={duration || 100}
                    step={1}
                    minStepsBetweenThumbs={1}
                    onValueChange={handleSliderChange}
                    className="py-4"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time (s)</Label>
                    <Input
                        id="start-time"
                        type="number"
                        placeholder="0"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        min="0"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-time">End Time (s)</Label>
                    <Input
                        id="end-time"
                        type="number"
                        placeholder="10"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        min="0"
                    />
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
                <Button onClick={previewSegment} variant="outline" className="flex-1" disabled={!start || !end}>
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Preview Segment
                </Button>
                <Button onClick={addSegment} className="flex-1" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" /> Add Segment
                </Button>
            </div>

            {segments.length > 0 && (
                <div className="space-y-4">
                    <Separator />
                    <h3 className="font-medium text-lg text-muted-foreground">Segments to Save</h3>
                    <div className="space-y-3">
                        {segments.map((seg) => (
                            <Card key={seg.id} className="p-4 flex items-center gap-4 bg-muted/50">
                                <div className="relative w-40 aspect-video rounded-md overflow-hidden flex-shrink-0 border border-border bg-black/10 flex items-center justify-center">
                                    {seg.thumbnail ? (
                                        <img
                                            src={seg.thumbnail}
                                            alt="Segment thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Loader2 className="w-6 h-6 animate-spin mb-1" />
                                            <span className="text-xs">Generating...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-lg">
                                        {formatTime(parseInt(seg.start))} - {formatTime(parseInt(seg.end))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Duration: {formatTime(parseInt(seg.end) - parseInt(seg.start))}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-muted-foreground hover:text-destructive flex-shrink-0"
                                    onClick={() => removeSegment(seg.id)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <Button onClick={handleSave} className="w-full h-12 text-lg" size="lg">
                        <Save className="w-5 h-5 mr-2" /> Save All Segments
                    </Button>
                </div>
            )}
        </div>
    );
}
