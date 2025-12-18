import { useState, useEffect } from "react";
import YouTube, { type YouTubePlayer, type YouTubeProps } from 'react-youtube';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import type { Clip, Note } from "@/types/clip";
import { Play, Plus, X, Trash2 } from "lucide-react";
import type { Tag } from "@/types/tag";
import { saveClips, saveNote, deleteNote } from "@/utils/storage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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


interface TagSectionProps {
    title?: string;
    sectionTags: Tag[];
    category: string;
    compact?: boolean;
    selectedTagIds: string[];
    onToggleTag: (tagId: string) => void;
    onCreateTag?: (name: string, color: string, category?: string) => Promise<string>;
}

function TagSection({ title, sectionTags, category, compact = false, selectedTagIds, onToggleTag, onCreateTag }: TagSectionProps) {
    const [sectionNewTagName, setSectionNewTagName] = useState("");
    const [sectionIsCreating, setSectionIsCreating] = useState(false);

    const handleSectionCreate = async () => {
        if (!sectionNewTagName.trim() || !onCreateTag) return;
        setSectionIsCreating(true);
        try {
            const newTagId = await onCreateTag(sectionNewTagName, "#3b82f6", category);
            onToggleTag(newTagId);
            setSectionNewTagName("");
        } catch (e) {
            console.error("Failed to create tag", e);
            toast.error("Failed to create tag");
        } finally {
            setSectionIsCreating(false);
        }
    };

    return (
        <div className={`space - y - 2 ${compact ? 'mt-1' : ''} `}>
            {title && <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>}
            <div className="flex flex-wrap gap-2">
                {sectionTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                        <Badge
                            key={tag.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor - pointer hover: opacity - 80 transition - opacity ${compact ? 'text-[10px] h-5 px-1.5' : ''} `}
                            onClick={() => onToggleTag(tag.id)}
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
                                className={`w - 20 text - xs ${compact ? 'h-5 text-[10px]' : 'h-6'} `}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSectionCreate();
                                    if (e.key === 'Escape') setSectionIsCreating(false);
                                }}
                            />
                            <Button size="sm" variant="ghost" className={`p - 0 ${compact ? 'h-5 w-5' : 'h-6 w-6'} `} onClick={handleSectionCreate}>
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className={`text - xs border - dashed ${compact ? 'h-5 px-1.5 text-[10px]' : 'h-6'} `}
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
}

interface NoteListProps {
    notes: Note[];
    onAddNote: (content: string) => Promise<void>;
    onDeleteNote: (noteId: string) => Promise<void>;
}

function NoteList({ notes, onAddNote, onDeleteNote }: NoteListProps) {
    const [newNoteContent, setNewNoteContent] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newNoteContent.trim()) return;
        setIsAdding(true);
        try {
            await onAddNote(newNoteContent);
            setNewNoteContent("");
        } catch (e) {
            console.error(e);
            toast.error("Failed to add note");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-2 mt-2">
            <div className="space-y-2">
                {notes.map(note => (
                    <div key={note.id} className="group flex items-start justify-between gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted text-sm transition-colors">
                        <p className="whitespace-pre-wrap flex-1">{note.content}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteNote(note.id)}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Add a note... (Ctrl+Enter to save)"
                    className="min-h-[60px] text-sm resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                />
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-[60px] w-[40px] shrink-0"
                    onClick={handleAdd}
                    disabled={isAdding || !newNoteContent.trim()}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export function CinemaModeModal({ isOpen, onClose, clip, originalVideo, onUpdateClip, tags = [], onCreateTag, onClipsSaved, onSwitchToClip }: CinemaModeModalProps) {
    // Notes state (synced with clip.notesList)
    const [localNotes, setLocalNotes] = useState<Note[]>([]);

    const [player, setPlayer] = useState<YouTubePlayer | null>(null);

    useEffect(() => {
        if (isOpen && clip) {
            console.log('CinemaModeModal opened with clip:', clip);
            setLocalNotes(clip.notesList || []);
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
    const isValidVideo = videoId && videoId.length === 11;

    if (!clip) return null;

    // Note Management Handlers
    const handleAddNote = async (content: string, category: string) => {
        if (!clip) return;
        try {
            const newNote = await saveNote(clip.id, content, category);
            const updatedNotes = [...localNotes, newNote];
            setLocalNotes(updatedNotes);
            onUpdateClip({ ...clip, notesList: updatedNotes });
            toast.success("Note added");
        } catch (e) {
            console.error(e);
            throw e; // Propagate to NoteList for error handling
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!clip) return;
        try {
            await deleteNote(noteId);
            const updatedNotes = localNotes.filter(n => n.id !== noteId);
            setLocalNotes(updatedNotes);
            onUpdateClip({ ...clip, notesList: updatedNotes });
            toast.success("Note deleted");
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete note");
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

    // Filter tags/notes by category
    const videoTags = tags.filter(t => !t.category || t.category === 'video');
    const titleTags = tags.filter(t => t.category === 'title');
    const thumbnailTags = tags.filter(t => t.category === 'thumbnail');

    const getNotesByCategory = (cat: string) => localNotes.filter(n => n.category === cat);

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        setPlayer(event.target);
        if (clip.start) {
            event.target.seekTo(clip.start, true);
        }
    };

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            start: clip.start ? Math.floor(clip.start) : undefined,
            end: clip.end ? Math.floor(clip.end) : undefined,
            origin: window.location.origin,
            autoplay: 0, // Disabled autoplay
        },
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Added [&>button]:hidden to hide the default close button injected by DialogContent */}
            <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Cinema Mode</DialogTitle>
                    <DialogDescription>
                        Viewing video: {clip.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex h-full overflow-hidden relative">
                    {/* Close button - Fixed absolute relative to the dialog content, not scroll area */}
                    <div className="absolute top-4 left-4 z-[100]">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 shadow-md transition-all"
                            onClick={() => onClose()}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Video Player Section (LEFT) */}
                    <div className="w-1/2 bg-black relative overflow-y-auto group">
                        {/* Added pt-16 to ensure video doesn't overlap with the top-left close button */}
                        <div className="p-6 pt-16 space-y-6">
                            {/* Video Player - show for both videos and clips */}
                            <div className="relative w-full bg-black aspect-video rounded-lg overflow-hidden border border-white/5">
                                {!isValidVideo ? (
                                    <div className="text-white flex items-center justify-center h-full">
                                        Invalid Video ID
                                    </div>
                                ) : (
                                    <div className="absolute inset-0">
                                        <YouTube
                                            videoId={videoId}
                                            opts={opts}
                                            className="w-full h-full"
                                            iframeClassName="w-full h-full"
                                            onReady={onPlayerReady}
                                            onError={(e) => console.error("Video player error:", e)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Scores - Displayed below video player */}
                            <div className="flex items-center gap-3 text-xs">
                                {displayOriginalScore != null && (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-md cursor-help border border-primary/20">
                                                <span className="font-medium">Score</span>
                                                <span className="font-bold">{Number(displayOriginalScore).toFixed(1)}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Overall Engagement Score</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {displayOriginalViralRatio != null && (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-500 px-2 py-1 rounded-md cursor-help border border-purple-500/20">
                                                <span className="font-medium">Viral</span>
                                                <span className="font-bold">{Number(displayOriginalViralRatio).toFixed(2)}x</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Viral Score: Views / Subscribers</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {(originalVideo?.timeSinceUploadRatio != null || clip.timeSinceUploadRatio != null) && (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md cursor-help border border-orange-500/20">
                                                <span className="font-medium">Velocity</span>
                                                <span className="font-bold">{Number(originalVideo?.timeSinceUploadRatio ?? clip.timeSinceUploadRatio).toFixed(1)}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Velocity Score: Views / Days since upload</p>
                                        </TooltipContent>
                                    </Tooltip>
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
                                        externalPlayer={player}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Title, Thumbnail, Video Sections (RIGHT) */}
                    <div className="w-1/2 flex flex-col h-full border-l bg-card/50 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">

                        {/* 1. TITLE SECTION */}
                        <div className="p-6 border-b space-y-4">
                            <h3 className="font-bold text-sm text-foreground/80 tracking-widest border-l-4 border-primary pl-3">TITLE</h3>
                            <div className="space-y-4 pl-4 border-l border-border/40 ml-1.5">
                                <h2 className="text-xl font-bold leading-tight">{clip.title}</h2>

                                <TagSection
                                    sectionTags={titleTags}
                                    category="title"
                                    compact={true}
                                    selectedTagIds={clip.tagIds || []}
                                    onToggleTag={handleToggleTag}
                                    onCreateTag={onCreateTag}
                                />

                                <NoteList
                                    notes={getNotesByCategory("title")}
                                    onAddNote={(c) => handleAddNote(c, "title")}
                                    onDeleteNote={handleDeleteNote}
                                />
                            </div>

                            {/* Original Video Info Card - only for clips */}
                            {isClip && (displayOriginalTitle || originalVideo) && (
                                <div className="ml-4 rounded-lg border bg-card/50 p-3 space-y-3 mt-4">
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
                                    {/* Metrics removed from here as they are now common above */}
                                </div>
                            )}
                        </div>

                        {/* 2. THUMBNAIL SECTION (Only for videos or if clip has one) */}
                        {!isClip && (
                            <div className="p-6 border-b space-y-4">
                                <h3 className="font-bold text-sm text-foreground/80 tracking-widest border-l-4 border-purple-500 pl-3">THUMBNAIL</h3>
                                <div className="space-y-4 pl-4 border-l border-border/40 ml-1.5">
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
                                    <TagSection
                                        sectionTags={thumbnailTags}
                                        category="thumbnail"
                                        compact={true}
                                        selectedTagIds={clip.tagIds || []}
                                        onToggleTag={handleToggleTag}
                                        onCreateTag={onCreateTag}
                                    />
                                    <NoteList
                                        notes={getNotesByCategory("thumbnail")}
                                        onAddNote={(c) => handleAddNote(c, "thumbnail")}
                                        onDeleteNote={handleDeleteNote}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 3. VIDEO SECTION */}
                        <div className="flex-1 p-6 border-b space-y-4">
                            <h3 className="font-bold text-sm text-foreground/80 tracking-widest border-l-4 border-blue-500 pl-3">VIDEO</h3>
                            <div className="space-y-4 pl-4 border-l border-border/40 ml-1.5">
                                <TagSection
                                    sectionTags={videoTags}
                                    category="video"
                                    selectedTagIds={clip.tagIds || []}
                                    onToggleTag={handleToggleTag}
                                    onCreateTag={onCreateTag}
                                />
                                <NoteList
                                    notes={getNotesByCategory("video")}
                                    onAddNote={(c) => handleAddNote(c, "video")}
                                    onDeleteNote={handleDeleteNote}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
// forcing rebuild
