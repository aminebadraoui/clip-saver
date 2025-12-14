import { useState, useEffect, useRef } from "react";
import ReactPlayer from 'react-player';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import type { Clip } from "@/types/clip";
import { Save, Play, Plus, X } from "lucide-react";
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
    onCreateTag?: (name: string, color: string, category?: string) => Promise<string>;
    onClipsSaved?: () => void;
    onSwitchToClip?: (clipId: string) => void;
}

export function CinemaModeModal({ isOpen, onClose, clip, originalVideo, onUpdateClip, tags = [], onCreateTag, onClipsSaved, onSwitchToClip }: CinemaModeModalProps) {
    const [notes, setNotes] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    // Removed unused state for legacy single tag creation

    const mainPlayerRef = useRef<ReactPlayer | null>(null);

    useEffect(() => {
        if (isOpen && clip) {
            console.log('CinemaModeModal opened with clip:', clip);
            setNotes(clip.notes || "");
        }
    }, [isOpen, clip]);

    // Helper to extract video ID
    const extractVideoId = (input: string): string => {
        if (!input) return "";
        const trimmedInput = input.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedInput)) {
            return trimmedInput;
        }
        try {
            const url = new URL(trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`);
            if (url.hostname.includes('youtube.com')) {
                return url.searchParams.get('v') || "";
            }
            if (url.hostname.includes('youtu.be')) {
                return url.pathname.slice(1) || "";
            }
        } catch (e) {
            return trimmedInput;
        }
        return trimmedInput;
    };

    const videoId = clip ? extractVideoId(clip.videoId) : "";
    const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
    const isValidVideo = videoId && videoId.length === 11;

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



    const isClip = clip.type === 'clip';
    // Use passed originalVideo or fallback to clip's stored metadata
    const displayOriginalTitle = originalVideo?.title || clip.originalTitle;
    const displayOriginalScore = originalVideo?.engagementScore ?? clip.engagementScore;
    const displayOriginalViralRatio = originalVideo?.viralRatio ?? clip.viralRatio;

    // Filter tags by category
    const videoTags = tags.filter(t => !t.category || t.category === 'video');
    const titleTags = tags.filter(t => t.category === 'title');
    const thumbnailTags = tags.filter(t => t.category === 'thumbnail');

    const renderTagSection = (title: string, sectionTags: Tag[], category: string, compact = false) => {
        const [sectionNewTagName, setSectionNewTagName] = useState("");
        const [sectionIsCreating, setSectionIsCreating] = useState(false);

        const handleSectionCreate = async () => {
            if (!sectionNewTagName.trim() || !onCreateTag) return;
            setSectionIsCreating(true);
            try {
                const newTagId = await onCreateTag(sectionNewTagName, "#3b82f6", category);
                handleToggleTag(newTagId);
                setSectionNewTagName("");
            } catch (e) {
                console.error("Failed to create tag", e);
                toast.error("Failed to create tag");
            } finally {
                setSectionIsCreating(false);
            }
        };

        return (
            <div className={`space-y-2 ${compact ? 'mt-2' : ''}`}>
                {!compact && <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>}
                <div className="flex flex-wrap gap-2">
                    {sectionTags.map(tag => {
                        const isSelected = clip.tagIds?.includes(tag.id);
                        return (
                            <Badge
                                key={tag.id}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer hover:opacity-80 transition-opacity ${compact ? 'text-[10px] h-5 px-1.5' : ''}`}
                                onClick={() => handleToggleTag(tag.id)}
                            >
                                {tag.name}
                            </Badge>
                        );
                    })}
                    <div className="flex items-center gap-2">
                        {sectionIsCreating ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                <Input
                                    value={sectionNewTagName}
                                    onChange={(e) => setSectionNewTagName(e.target.value)}
                                    placeholder="New..."
                                    className={`w-20 text-xs ${compact ? 'h-5 text-[10px]' : 'h-6'}`}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSectionCreate();
                                        if (e.key === 'Escape') setSectionIsCreating(false);
                                    }}
                                />
                                <Button size="sm" variant="ghost" className={`p-0 ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} onClick={handleSectionCreate}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className={`text-xs border-dashed ${compact ? 'h-5 px-1.5 text-[10px]' : 'h-6'}`}
                                onClick={() => setSectionIsCreating(true)}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                {compact ? 'Add' : 'New Tag'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader className="sr-only">
                    <DialogTitle>Cinema Mode</DialogTitle>
                    <DialogDescription>
                        Viewing video: {clip.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex h-full overflow-hidden">
                    {/* Video Player Section */}
                    <div className="w-1/2 bg-black relative overflow-y-auto">
                        {/* Close button for video area */}
                        <div className="absolute top-4 left-4 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => onClose()}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Video Player - show for both videos and clips */}
                            <div className="relative w-full bg-black aspect-video">
                                {!isValidVideo ? (
                                    <div className="text-white flex items-center justify-center h-full">
                                        Invalid Video ID
                                    </div>
                                ) : (
                                    <div className="absolute inset-0">
                                        <ReactPlayer
                                            key={videoId}
                                            ref={mainPlayerRef}
                                            url={videoUrl}
                                            width="100%"
                                            height="100%"
                                            controls={true}
                                            playing={true}
                                            config={{
                                                youtube: {
                                                    playerVars: {
                                                        start: clip.start ? Math.floor(clip.start) : undefined,
                                                        end: clip.end ? Math.floor(clip.end) : undefined,
                                                        origin: window.location.origin,
                                                    }
                                                }
                                            }}
                                            onReady={(player) => {
                                                console.log("Player ready");
                                                if (clip.start) {
                                                    player.seekTo(clip.start);
                                                }
                                            }}
                                            onError={(e) => {
                                                console.error("Video player error:", e);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Clip Creation Section - only for videos */}
                            {!isClip && (
                                <div className="rounded-lg border bg-background/10 p-4">
                                    <SegmentBuilder
                                        videoId={videoId}
                                        videoTitle={clip.title}
                                        thumbnail={clip.thumbnail}
                                        onSave={handleSaveClips}
                                        tags={tags}
                                        onCreateTag={onCreateTag}
                                        hideVideo={true}
                                        externalPlayerRef={mainPlayerRef as React.RefObject<ReactPlayer>}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Notes & Clipping */}
                    <div className="w-1/2 flex flex-col h-full border-l bg-card/50 overflow-y-auto">
                        {/* Title & Thumbnail Section */}
                        <div className="p-6 border-b space-y-4">
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold leading-tight">{clip.title}</h2>
                                {/* Title Tags */}
                                {renderTagSection("Title Tags", titleTags, "title", true)}
                            </div>

                            {/* Original Video Info Card - only for clips */}
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
                                <div className="space-y-2">
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
                                    {/* Thumbnail Tags */}
                                    {renderTagSection("Thumbnail Tags", thumbnailTags, "thumbnail", true)}
                                </div>
                            )}
                        </div>

                        {/* Video Tags Section */}
                        <div className="p-6 border-b space-y-3">
                            {renderTagSection("Video Tags", videoTags, "video")}
                        </div>

                        {/* Notes Section */}
                        <div className="flex-1 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Notes</h3>
                                <Button
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSavingNotes ? "Saving..." : "Save Notes"}
                                </Button>
                            </div>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes, thoughts, and ideas here..."
                                className="min-h-[200px] resize-none bg-background/50 focus:bg-background transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
// forcing rebuild
