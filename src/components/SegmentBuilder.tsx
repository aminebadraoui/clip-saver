import { useState, useEffect, type RefObject } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/utils/formatTime";
import { Trash2, Plus, Save, Play, Camera } from "lucide-react";
import type { Clip } from "@/types/clip";

interface Segment {
    id: string;
    start: string;
    end: string;
    thumbnail?: string | null;
}

interface SegmentBuilderProps {
    videoId: string;
    videoTitle: string;
    thumbnail: string;
    videoRef: RefObject<HTMLVideoElement | null>;
    onSave: (clips: Clip[]) => void;
}

export function SegmentBuilder({ videoId, videoTitle, thumbnail, videoRef, onSave }: SegmentBuilderProps) {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [sliderValue, setSliderValue] = useState([0, 0]);
    const [duration, setDuration] = useState<number>(0);

    // Get duration from video element
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            const updateDuration = () => {
                setDuration(video.duration || 0);
            };

            if (video.duration) {
                updateDuration();
            }

            video.addEventListener('loadedmetadata', updateDuration);
            return () => video.removeEventListener('loadedmetadata', updateDuration);
        }
    }, [videoRef]);

    // Sync slider with inputs
    useEffect(() => {
        const s = parseInt(start) || 0;
        const e = parseInt(end) || 0;
        setSliderValue([s, e]);
    }, [start, end]);

    const handleSliderChange = (value: number[]) => {
        const prevStart = sliderValue[0];
        const prevEnd = sliderValue[1];

        console.log('Slider changed:', { prevStart, prevEnd, newStart: value[0], newEnd: value[1] });
        console.log('Video element:', videoRef.current);

        setSliderValue(value);
        setStart(value[0].toString());
        setEnd(value[1].toString());

        const video = videoRef.current;
        if (video) {
            // Determine which thumb was moved and seek accordingly
            if (value[0] !== prevStart) {
                // Start thumb was moved
                console.log('Seeking to start:', value[0]);
                video.currentTime = value[0];
            } else if (value[1] !== prevEnd) {
                // End thumb was moved
                console.log('Seeking to end:', value[1]);
                video.currentTime = value[1];
            }
        } else {
            console.log('Video element is null!');
        }
    };

    const handleCapture = () => {
        const video = videoRef.current;
        if (!video) {
            setError("Video not loaded");
            return;
        }

        try {
            setIsCapturing(true);
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setCapturedThumbnail(canvas.toDataURL("image/jpeg"));
            }
        } catch (err) {
            console.error("Capture failed", err);
            setError("Failed to capture frame. Please try again.");
        } finally {
            setIsCapturing(false);
        }
    };

    const previewSegment = () => {
        const video = videoRef.current;
        if (!video) return;
        const s = parseInt(start);
        const e = parseInt(end);
        if (!isNaN(s) && !isNaN(e) && s < e) {
            video.currentTime = s;
            video.play();

            // Stop at end time
            const checkTime = setInterval(() => {
                if (video.currentTime >= e) {
                    video.pause();
                    clearInterval(checkTime);
                }
            }, 100);

            // Clear interval after duration
            setTimeout(() => clearInterval(checkTime), (e - s + 1) * 1000);
        }
    };

    const addSegment = () => {
        setError(null);
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (isNaN(startNum) || isNaN(endNum)) {
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

        // Auto-capture thumbnail at start time
        const video = videoRef.current;
        let autoThumbnail: string | null = null;

        if (video) {
            try {
                // Seek to start time
                video.currentTime = startNum;

                // Wait a brief moment for the frame to load, then capture
                setTimeout(() => {
                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        autoThumbnail = canvas.toDataURL("image/jpeg");

                        // Create segment with auto-captured thumbnail
                        const newSegment: Segment = {
                            id: uuidv4(),
                            start: start,
                            end: end,
                            thumbnail: capturedThumbnail || autoThumbnail, // Use manual capture if available, otherwise auto
                        };

                        setSegments([...segments, newSegment]);
                        setStart("");
                        setEnd("");
                        setSliderValue([0, 0]);
                        setCapturedThumbnail(null);
                    }
                }, 100); // Small delay to ensure frame is loaded

                return; // Exit early since we're handling async
            } catch (err) {
                console.error("Auto-capture failed:", err);
            }
        }

        // Fallback if video not available or capture failed
        const newSegment: Segment = {
            id: uuidv4(),
            start: start,
            end: end,
            thumbnail: capturedThumbnail,
        };

        setSegments([...segments, newSegment]);
        setStart("");
        setEnd("");
        setSliderValue([0, 0]);
        setCapturedThumbnail(null);
    };

    const removeSegment = (id: string) => {
        setSegments(segments.filter((s) => s.id !== id));
    };

    const getSmartThumbnail = (start: number) => {
        if (!duration) return thumbnail; // Fallback to main thumbnail if duration unknown

        const ratio = start / duration;
        let thumbIndex = "1"; // Default to ~25% mark

        if (ratio < 0.375) {
            thumbIndex = "1";
        } else if (ratio < 0.625) {
            thumbIndex = "2";
        } else {
            thumbIndex = "3";
        }

        return `https://img.youtube.com/vi/${videoId}/${thumbIndex}.jpg`;
    };

    const handleSave = () => {
        if (segments.length === 0) return;

        const clips: Clip[] = segments.map((seg) => {
            const startSeconds = parseInt(seg.start);
            // Use captured thumbnail if available for this segment, otherwise smart thumbnail
            const finalThumbnail = seg.thumbnail || getSmartThumbnail(startSeconds);

            return {
                id: uuidv4(),
                videoId,
                title: videoTitle,
                thumbnail: finalThumbnail,
                start: startSeconds,
                end: parseInt(seg.end),
                createdAt: Date.now(),
            };
        });

        onSave(clips);
    };

    return (
        <div className="space-y-6">
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

            {capturedThumbnail && (
                <div className="relative w-32 aspect-video rounded-md overflow-hidden border border-border">
                    <img src={capturedThumbnail} alt="Captured" className="w-full h-full object-cover" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setCapturedThumbnail(null)}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            )}

            <div className="flex gap-2">
                <Button onClick={previewSegment} variant="outline" className="flex-1" disabled={!start || !end}>
                    <Play className="w-4 h-4 mr-2" /> Preview
                </Button>
                <Button onClick={handleCapture} variant="outline" className="flex-1" disabled={isCapturing}>
                    <Camera className="w-4 h-4 mr-2" /> {isCapturing ? "Capturing..." : "Snapshot"}
                </Button>
                <Button onClick={addSegment} className="flex-1" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" /> Add Segment
                </Button>
            </div>

            {segments.length > 0 && (
                <div className="space-y-4">
                    <Separator />
                    <h3 className="font-medium text-sm text-muted-foreground">Segments to Save</h3>
                    <div className="space-y-2">
                        {segments.map((seg) => (
                            <Card key={seg.id} className="p-3 flex items-center gap-3 bg-muted/50">
                                {seg.thumbnail && (
                                    <div className="relative w-24 aspect-video rounded overflow-hidden flex-shrink-0 border border-border">
                                        <img
                                            src={seg.thumbnail}
                                            alt="Segment thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 text-sm font-medium">
                                    {formatTime(parseInt(seg.start))} - {formatTime(parseInt(seg.end))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                                    onClick={() => removeSegment(seg.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <Button onClick={handleSave} className="w-full" size="lg">
                        <Save className="w-4 h-4 mr-2" /> Save All Segments
                    </Button>
                </div>
            )}
        </div>
    );
}
