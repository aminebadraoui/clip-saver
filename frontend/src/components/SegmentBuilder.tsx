import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import YouTube, { type YouTubePlayer, type YouTubeProps } from 'react-youtube';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { formatTime } from "@/utils/formatTime";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Play, Pause, Loader2, Plus, Trash2 } from "lucide-react";
import type { Clip } from "@/types/clip";
import type { Tag } from "@/types/tag";

interface SegmentBuilderProps {
    videoId: string;
    videoTitle: string;
    thumbnail: string;
    onSave: (clips: Clip[]) => void;
    tags?: Tag[];
    onCreateTag?: (name: string, color: string, category?: string) => Promise<string>;
    hideVideo?: boolean;
    externalPlayer?: YouTubePlayer | null;
}

export function SegmentBuilder({ videoId, videoTitle, thumbnail, onSave, tags = [], onCreateTag, hideVideo = false, externalPlayer }: SegmentBuilderProps) {
    const [start, setStart] = useState("0");
    const [end, setEnd] = useState("0");
    const [duration, _setDuration] = useState(0);
    const [isPlaying, _setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New state for individual clip saving
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [newTagName, setNewTagName] = useState("");
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Restored state for multi-segment accumulation
    interface PendingSegment {
        id: string;
        title?: string;
        start: number;
        end: number;
        notes: string;
        tagIds: string[];
        thumbnail: string;
        isThumbnailLoading?: boolean;
    }
    const [segments, setSegments] = useState<PendingSegment[]>([]);

    const [internalPlayer, setInternalPlayer] = useState<YouTubePlayer | null>(null);
    const previewIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Use external player if provided and video is hidden
    const activePlayer = (hideVideo && externalPlayer) ? externalPlayer : internalPlayer;

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        setInternalPlayer(event.target);
        if (event.target.getDuration) {
            _setDuration(event.target.getDuration());
        }
    };

    const previewSegment = () => {
        if (!activePlayer) return;

        const s = parseInt(start);
        const e = parseInt(end);

        if (!isNaN(s) && !isNaN(e) && s < e) {
            activePlayer.seekTo(s, true);
            activePlayer.playVideo();
            _setIsPlaying(true);

            // Clear existing interval
            if (previewIntervalRef.current) {
                clearInterval(previewIntervalRef.current);
            }

            // Stop at end time
            previewIntervalRef.current = setInterval(() => {
                // Check player state/time
                if (!activePlayer || (activePlayer.getPlayerState && activePlayer.getPlayerState() !== 1)) return; // 1 is playing

                const currentTime = activePlayer.getCurrentTime();

                if (currentTime >= e) {
                    activePlayer.pauseVideo();
                    _setIsPlaying(false);
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

    const handleAddSegment = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
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

        const newSegmentId = uuidv4();
        const newSegment: PendingSegment = {
            id: newSegmentId,
            title: title.trim() || undefined,
            start: startNum,
            end: endNum,
            notes,
            tagIds: selectedTagIds,
            thumbnail: thumbnail, // Default to video thumbnail initially
            isThumbnailLoading: true
        };

        setSegments(prev => [...prev, newSegment]);

        // Reset form
        setStart(endNum.toString());
        setEnd((endNum + 10).toString());
        setTitle("");
        setNotes("");
        setSelectedTagIds([]);

        // Trigger background thumbnail generation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        fetch('/api/capture-thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoId,
                timestamp: startNum
            }),
            signal: controller.signal
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Failed to generate thumbnail");
            })
            .then(data => {
                clearTimeout(timeoutId);
                if (data.url) {
                    setSegments(prev => prev.map(s =>
                        s.id === newSegmentId
                            ? { ...s, thumbnail: data.url, isThumbnailLoading: false }
                            : s
                    ));
                } else {
                    setSegments(prev => prev.map(s =>
                        s.id === newSegmentId
                            ? { ...s, isThumbnailLoading: false }
                            : s
                    ));
                }
            })
            .catch(e => {
                clearTimeout(timeoutId);
                console.error("Thumbnail capture failed", e);
                setSegments(prev => prev.map(s =>
                    s.id === newSegmentId
                        ? { ...s, isThumbnailLoading: false }
                        : s
                ));
            });
    };

    const removeSegment = (id: string) => {
        setSegments(segments.filter(s => s.id !== id));
    };

    const handleSaveAll = () => {
        setIsSaving(true);
        try {
            const newClips: Clip[] = segments.map(seg => ({
                id: uuidv4(),
                type: 'clip',
                videoId,
                title: seg.title || videoTitle,
                thumbnail: seg.thumbnail,
                start: seg.start,
                end: seg.end,
                createdAt: Date.now(),
                notes: seg.notes,
                tagIds: seg.tagIds
            }));

            onSave(newClips);
            setSegments([]);
        } catch (e) {
            console.error("Failed to save clips", e);
            setError("Failed to save clips.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
        } else {
            setSelectedTagIds([...selectedTagIds, tagId]);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim() || !onCreateTag) return;
        setIsCreatingTag(true);
        try {
            const newTagId = await onCreateTag(newTagName, "#3b82f6", "video"); // Default blue, video category
            setSelectedTagIds([...selectedTagIds, newTagId]);
            setNewTagName("");
        } catch (e) {
            console.error("Failed to create tag", e);
            setError("Failed to create tag.");
        } finally {
            setIsCreatingTag(false);
        }
    };

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            origin: window.location.origin,
            autoplay: isPlaying ? 1 : 0,
        },
    };

    return (
        <div className="space-y-6">
            {!hideVideo && (
                <Card className="overflow-hidden bg-black">
                    <div className="w-full h-[400px] flex items-center justify-center relative">
                        <div className="absolute inset-0">
                            <YouTube
                                videoId={videoId || "dQw4w9WgXcQ"}
                                opts={opts}
                                className="w-full h-full"
                                iframeClassName="w-full h-full"
                                onReady={onPlayerReady}
                                onPlay={() => _setIsPlaying(true)}
                                onPause={() => _setIsPlaying(false)}
                                onError={(e) => console.error('SegmentBuilder: Player Error', e)}
                            />
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Create Clip</h3>

                {/* Time Controls */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Start Time</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    if (activePlayer && activePlayer.getCurrentTime) {
                                        const time = activePlayer.getCurrentTime();
                                        setStart(Math.floor(time).toString());
                                    }
                                }}
                            >
                                Set Start
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2">
                        <Label>End Time</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                variant="secondary"
                                disabled={!start || parseInt(start) < 0}
                                onClick={() => {
                                    if (activePlayer && activePlayer.getCurrentTime) {
                                        const time = activePlayer.getCurrentTime();
                                        setEnd(Math.ceil(time).toString());
                                    }
                                }}
                            >
                                Set End
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Duration: {formatTime(Math.max(0, parseInt(end) - parseInt(start)))}</span>
                    <span>Video Length: {formatTime(duration)}</span>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Title (Optional)</Label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={videoTitle}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for this clip..."
                        className="h-20 resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map(tag => (
                            <Badge
                                key={tag.id}
                                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleTag(tag.id)}
                                style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : { borderColor: tag.color, color: tag.color }}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                    {onCreateTag && (
                        <div className="flex gap-2">
                            <Input
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Create new tag..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateTag();
                                }}
                                className="h-8 text-sm"
                            />
                            <Button variant="outline" size="sm" onClick={handleCreateTag} disabled={isCreatingTag || !newTagName.trim()}>
                                {isCreatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button onClick={previewSegment} variant="outline" className="flex-1" disabled={!start || !end}>
                        {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        Preview
                    </Button>
                    <Button onClick={handleAddSegment} className="flex-1" disabled={!start || !end}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Segment
                    </Button>
                </div>
            </div>

            {/* List of Pending Segments */}
            {segments.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-lg">Segments to Save ({segments.length})</h3>
                    <div className="space-y-3">
                        {segments.map((seg) => (
                            <Card key={seg.id} className="p-3 flex gap-3 bg-muted/50 relative group">
                                <div className="w-32 aspect-video rounded bg-black/20 flex-shrink-0 overflow-hidden relative">
                                    <img src={seg.thumbnail} alt="Thumbnail" className={`w-full h-full object-cover ${seg.isThumbnailLoading ? 'opacity-50' : ''}`} />
                                    {seg.isThumbnailLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                        {seg.title || "Untitled Segment"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {formatTime(seg.start)} - {formatTime(seg.end)}
                                    </div>
                                    {seg.notes && (
                                        <p className="text-sm text-muted-foreground truncate">{seg.notes}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {seg.tagIds.map(tid => {
                                            const t = tags.find(tag => tag.id === tid);
                                            return t ? (
                                                <Badge key={tid} variant="outline" className="text-[10px] h-5 px-1" style={{ color: t.color, borderColor: t.color }}>
                                                    {t.name}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeSegment(seg.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <Button onClick={handleSaveAll} className="w-full h-12 text-lg" size="lg" disabled={isSaving || segments.some(s => s.isThumbnailLoading)}>
                        {isSaving || segments.some(s => s.isThumbnailLoading) ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        Save All Segments
                    </Button>
                </div>
            )}
        </div>
    );
}
