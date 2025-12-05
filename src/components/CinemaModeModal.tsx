import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import type { Clip } from "@/types/clip";
import { Save, Play, Plus } from "lucide-react";
import type { Tag } from "@/types/tag";
import { saveClips } from "@/utils/storage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CinemaModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    clip: Clip | null;
    originalVideo?: Clip | null;
    onUpdateClip: (updatedClip: Clip) => void;
    tags?: Tag[];
    onCreateTag?: (name: string, color: string) => Promise<string>;
    onClipsSaved?: () => void;
    onSwitchToClip?: (clipId: string) => void;
}

export function CinemaModeModal({ isOpen, onClose, clip, originalVideo, onUpdateClip, tags = [], onCreateTag, onClipsSaved, onSwitchToClip }: CinemaModeModalProps) {
    const [notes, setNotes] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isCreatingTag, setIsCreatingTag] = useState(false);

    useEffect(() => {
        if (isOpen && clip) {
            setNotes(clip.notes || "");
        }
    }, [isOpen, clip]);

    if (!clip) return null;

    const handleSaveNotes = async () => {
        if (!clip) return;
        setIsSavingNotes(true);
        try {
            const updatedClip = { ...clip, notes };
            onUpdateClip(updatedClip);
        } catch (error) {
            console.error("Failed to save notes:", error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleSaveClips = async (newClips: Clip[]) => {
        // Add metadata from original clip (parent video)
        const clipsWithMetadata = newClips.map(newClip => ({
            ...newClip,
            sourceVideoId: clip.id,
            originalVideoUrl: clip.originalVideoUrl || `https://www.youtube.com/watch?v=${clip.videoId}`,
            originalTitle: clip.title,
            // Copy metrics from parent
            viewCount: clip.viewCount,
            viralRatio: clip.viralRatio,
            engagementScore: clip.engagementScore,
            subscriberCount: clip.subscriberCount,
            uploadDate: clip.uploadDate,
        }));

        await saveClips(clipsWithMetadata);
        toast.success("Clip saved successfully!");
        if (onClipsSaved) {
            onClipsSaved();
        }
    };

    const handleToggleTag = (tagId: string) => {
        if (!clip) return;
        const currentTags = clip.tagIds || [];
        const newTags = currentTags.includes(tagId)
            ? currentTags.filter(id => id !== tagId)
            : [...currentTags, tagId];
        onUpdateClip({ ...clip, tagIds: newTags });
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim() || !onCreateTag) return;
        setIsCreatingTag(true);
        try {
            const newTagId = await onCreateTag(newTagName, "#3b82f6");
            handleToggleTag(newTagId);
            setNewTagName("");
        } catch (e) {
            console.error("Failed to create tag", e);
            toast.error("Failed to create tag");
        } finally {
            setIsCreatingTag(false);
        }
    };

    const isClip = clip.type === 'clip';
    // Use passed originalVideo or fallback to clip's stored metadata
    const displayOriginalTitle = originalVideo?.title || clip.originalTitle;
    const displayOriginalScore = originalVideo?.engagementScore ?? clip.engagementScore;
    const displayOriginalViralRatio = originalVideo?.viralRatio ?? clip.viralRatio;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
                <div className="flex items-center justify-end p-2 border-b">
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Column: Video Player */}
                    <div className="bg-black flex flex-col overflow-y-auto">
                        {isClip ? (
                            <div className="flex items-center justify-center h-full bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${clip.videoId}?start=${Math.floor(clip.start || 0)}&end=${Math.ceil(clip.end || 0)}&autoplay=1&rel=0`}
                                    title={clip.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="aspect-video w-full h-full"
                                />
                            </div>
                        ) : (
                            /* Create Clip Section for Videos */
                            <div className="p-6 space-y-4 h-full">
                                <div className="rounded-lg border bg-background/10 p-4 h-full">
                                    <SegmentBuilder
                                        videoId={clip.videoId}
                                        videoTitle={clip.title}
                                        thumbnail={clip.thumbnail}
                                        onSave={handleSaveClips}
                                        tags={tags}
                                        onCreateTag={onCreateTag}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Notes & Clipping */}
                    <div className="flex flex-col h-full border-l bg-card/50 overflow-y-auto">
                        {/* Title & Thumbnail Section */}
                        <div className="p-6 border-b space-y-4">
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold leading-tight">{clip.title}</h2>
                            </div>

                            {/* Original Video Info Card */}
                            {isClip && (displayOriginalTitle || originalVideo) && (
                                <div className="rounded-lg border bg-card/50 p-3 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Original Video</p>
                                            <p className="text-sm font-medium line-clamp-2">{displayOriginalTitle}</p>
                                        </div>
                                        {onSwitchToClip && clip.sourceVideoId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => onSwitchToClip(clip.sourceVideoId!)}
                                                title="View Original Video"
                                            >
                                                <Play className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Metrics */}
                                    <div className="flex items-center gap-3 text-xs">
                                        {displayOriginalScore != null && (
                                            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-md">
                                                <span className="font-medium">Score</span>
                                                <span className="font-bold">{Number(displayOriginalScore).toFixed(1)}</span>
                                            </div>
                                        )}
                                        {displayOriginalViralRatio != null && (
                                            <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-500 px-2 py-1 rounded-md">
                                                <span className="font-medium">Viral</span>
                                                <span className="font-bold">{Number(displayOriginalViralRatio).toFixed(2)}x</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isClip && (
                                <div className="aspect-video w-full rounded-lg overflow-hidden border shadow-sm">
                                    <img
                                        src={clip.thumbnail.replace('hqdefault', 'maxresdefault')}
                                        alt={clip.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = clip.thumbnail;
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Tags Section */}
                        <div className="p-6 border-b space-y-3">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => {
                                    const isSelected = clip.tagIds?.includes(tag.id);
                                    return (
                                        <Badge
                                            key={tag.id}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => handleToggleTag(tag.id)}
                                            style={isSelected ? { backgroundColor: tag.color } : { borderColor: tag.color, color: tag.color }}
                                        >
                                            {tag.name}
                                        </Badge>
                                    );
                                })}
                            </div>
                            {onCreateTag && (
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        placeholder="New tag..."
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                                    />
                                    <Button size="sm" variant="outline" onClick={handleCreateTag} disabled={isCreatingTag || !newTagName.trim()}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Notes Section */}
                        <div className="p-6 space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Notes</h3>
                                <Button
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes || notes === clip.notes}
                                >
                                    {isSavingNotes ? "Saving..." : "Save Notes"}
                                    <Save className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes here..."
                                className="min-h-[200px] resize-none bg-background/50"
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
