import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import type { Clip } from "@/types/clip";
import { Loader2 } from "lucide-react";

interface AddVideoSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (videoData: any) => Promise<void>;
    folders: Folder[];
    tags: Tag[];
    clips: Clip[];
    initialUrl?: string;
    onCreateFolder: (name: string, parentId: string | null) => Promise<string>;
    onCreateTag: (name: string, color: string) => Promise<string>;
}

export function AddVideoSheet({ isOpen, onClose, onSave, folders, tags, clips, initialUrl = "", onCreateFolder, onCreateTag }: AddVideoSheetProps) {
    const [url, setUrl] = useState(initialUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'url' | 'details'>('url');

    // Details form state
    const [title, setTitle] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [videoId, setVideoId] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string>("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    // const [prompt, setPrompt] = useState(""); // Removed AI Prompt state

    // New Metrics State
    // Metrics State
    const [viewCount, setViewCount] = useState<number | undefined>();
    const [subscriberCount, setSubscriberCount] = useState<number | undefined>();
    const [uploadDate, setUploadDate] = useState<string | undefined>();
    const [viralRatio, setViralRatio] = useState<number | undefined>();
    const [timeRatio, setTimeRatio] = useState<number | undefined>();
    const [engagementScore, setEngagementScore] = useState<number | undefined>();

    // Creation State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isSavingFolder, setIsSavingFolder] = useState(false);
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isSavingTag, setIsSavingTag] = useState(false);
    const [isSavingVideo, setIsSavingVideo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setUrl(initialUrl);
        setStep('url');
        setTitle("");
        setThumbnail("");
        setVideoId("");
        setSelectedFolderId("");
        setSelectedTagIds([]);
        setNotes("");
        // setPrompt(""); // Removed AI Prompt reset
        // setPrompt(""); // Removed AI Prompt reset
        setViewCount(undefined);
        setSubscriberCount(undefined);
        setUploadDate(undefined);
        setViralRatio(undefined);
        setTimeRatio(undefined);
        setEngagementScore(undefined);
        setIsCreatingFolder(false);
        setNewFolderName("");
        setIsCreatingTag(false);
        setNewTagName("");
        setError(null);
        setIsSavingFolder(false);
        setIsSavingTag(false);
        setIsSavingVideo(false);
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();

            // Load defaults from localStorage
            const savedFolderId = localStorage.getItem("lastUsedFolderId");
            if (savedFolderId) {
                setSelectedFolderId(savedFolderId);
            }

            const savedTagIds = localStorage.getItem("lastUsedTagIds");
            if (savedTagIds) {
                try {
                    const parsedTags = JSON.parse(savedTagIds);
                    if (Array.isArray(parsedTags)) {
                        setSelectedTagIds(parsedTags);
                    }
                } catch (e) {
                    console.error("Failed to parse saved tags", e);
                }
            }

            if (initialUrl) {
                setUrl(initialUrl);
                // Auto-fetch if we have a URL
                handleUrlSubmit(new Event('submit') as any, initialUrl);
            }
        }
    }, [isOpen, initialUrl]);

    const extractVideoId = (inputUrl: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = inputUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleUrlSubmit = async (e: React.FormEvent, overrideUrl?: string) => {
        if (e) e.preventDefault();
        const urlToUse = overrideUrl || url;
        const id = extractVideoId(urlToUse);
        if (!id) {
            // Only alert if it's a manual submission or if we really expect a valid URL
            if (!overrideUrl) alert("Invalid YouTube URL");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/info?videoId=${id}`);
            if (!response.ok) throw new Error("Failed to fetch video info");

            const data = await response.json();
            setTitle(data.title);
            setThumbnail(data.thumbnail);
            setVideoId(id);
            setViewCount(data.viewCount);
            setSubscriberCount(data.subscriberCount);
            setUploadDate(data.uploadDate);

            // Calculate Metrics
            let vRatioRaw: number | undefined;
            let vRatioNorm: number | undefined;
            let tRatio: number | undefined;
            let eScore: number | undefined;

            if (data.viewCount && data.subscriberCount) {
                vRatioRaw = data.viewCount / data.subscriberCount;
                // Normalize to 0-10 scale for Score calculation only
                // 0.01x = 0, 1x = 5, 100x = 10
                vRatioNorm = Math.min(10, Math.max(0, (Math.log10(Math.max(vRatioRaw, 0.0001)) + 2) * 2.5));
            }

            if (data.viewCount && data.uploadDate) {
                const year = parseInt(data.uploadDate.substring(0, 4));
                const month = parseInt(data.uploadDate.substring(4, 6)) - 1;
                const day = parseInt(data.uploadDate.substring(6, 8));
                const uploadDt = new Date(year, month, day);
                const daysSince = Math.max(1, (new Date().getTime() - uploadDt.getTime()) / (1000 * 3600 * 24));
                const rawVelocity = data.viewCount / daysSince;
                // Normalize to 0-10 scale (logarithmic)
                // 100k views/day = 10
                tRatio = Math.min(10, (Math.log10(rawVelocity + 1) / 5) * 10);
            }

            if (vRatioNorm !== undefined && tRatio !== undefined) {
                // Average of the two normalized scores
                eScore = (vRatioNorm + tRatio) / 2;
            }

            setViralRatio(vRatioRaw); // Store Raw Ratio
            setTimeRatio(tRatio);     // Store Normalized Velocity
            setEngagementScore(eScore); // Store Normalized Score

            setStep('details');
        } catch (error) {
            console.error(error);
            alert("Failed to load video details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        // Check for duplicate video
        // We allow duplicate clips (type='clip'), but not duplicate full videos (type='video')
        const isDuplicate = clips.some(c =>
            c.type === 'video' &&
            c.videoId === videoId
        );

        if (isDuplicate) {
            setError("This video has already been added.");
            return;
        }

        setError(null);
        setIsSavingVideo(true);
        try {
            await onSave({
                videoId,
                title,
                thumbnail,
                folderId: selectedFolderId || null,
                tagIds: selectedTagIds,
                notes,

                // aiPrompt: prompt, // Removed AI Prompt
                originalVideoUrl: url,
                viewCount,
                subscriberCount,
                uploadDate,
                viralRatio,
                timeSinceUploadRatio: timeRatio,
                engagementScore,
            });

            // Save defaults to localStorage
            if (selectedFolderId) {
                localStorage.setItem("lastUsedFolderId", selectedFolderId);
            }
            if (selectedTagIds.length > 0) {
                localStorage.setItem("lastUsedTagIds", JSON.stringify(selectedTagIds));
            }

            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to save video. Please try again.");
        } finally {
            setIsSavingVideo(false);
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{step === 'url' ? "Add New Video" : "Video Details"}</SheetTitle>
                </SheetHeader>

                {step === 'url' ? (
                    <form onSubmit={handleUrlSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">YouTube URL</Label>
                            <Input
                                id="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <SheetFooter>
                            <Button type="submit" disabled={!url || isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Fetching..." : "Fetch Details"}
                            </Button>
                        </SheetFooter>
                    </form>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col gap-4">
                            <img
                                src={thumbnail}
                                alt={title}
                                className="w-full h-48 object-cover rounded-md bg-muted"
                            />
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Metrics Display */}
                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                <div className="text-center">
                                    <span className="block font-semibold text-foreground">
                                        {viewCount ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(viewCount) : '-'}
                                    </span>
                                    Views
                                </div>
                                <div className="text-center">
                                    <span className="block font-semibold text-foreground">
                                        {subscriberCount ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(subscriberCount) : '-'}
                                    </span>
                                    Subs
                                </div>
                                <div className="text-center">
                                    <span className="block font-semibold text-foreground">
                                        {uploadDate ? uploadDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '-'}
                                    </span>
                                    Uploaded
                                </div>
                            </div>

                            {/* Advanced Metrics */}
                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                <div className="text-center">
                                    <span className="block font-semibold text-foreground">
                                        {viralRatio ? `${viralRatio.toFixed(2)}x` : '-'}
                                    </span>
                                    Viral Ratio
                                </div>
                                <div className="text-center">
                                    <span className="block font-semibold text-foreground">
                                        {timeRatio ? timeRatio.toFixed(1) : '-'}
                                        <span className="text-[10px] text-muted-foreground ml-0.5">/10</span>
                                    </span>
                                    Velocity
                                </div>
                                <div className="text-center">
                                    <span className="block font-semibold text-foreground">
                                        {engagementScore ? engagementScore.toFixed(1) : '-'}
                                        <span className="text-[10px] text-muted-foreground ml-0.5">/10</span>
                                    </span>
                                    Score
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Folder</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                                >
                                    {isCreatingFolder ? "Cancel" : "+ New Folder"}
                                </Button>
                            </div>

                            {isCreatingFolder ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Folder Name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        className="h-9"
                                        disabled={isSavingFolder}
                                    />
                                    <Button
                                        size="sm"
                                        disabled={isSavingFolder || !newFolderName.trim()}
                                        onClick={async () => {
                                            if (newFolderName.trim()) {
                                                setIsSavingFolder(true);
                                                try {
                                                    const newId = await onCreateFolder(newFolderName, null);
                                                    setSelectedFolderId(newId);
                                                    setNewFolderName("");
                                                    setIsCreatingFolder(false);
                                                } catch (err) {
                                                    console.error(err);
                                                    // Could set a specific folder error, but for now log it.
                                                    // Ideally show a small error message here.
                                                    alert("Failed to create folder");
                                                } finally {
                                                    setIsSavingFolder(false);
                                                }
                                            }
                                        }}
                                    >
                                        {isSavingFolder ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                                    </Button>
                                </div>
                            ) : (
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedFolderId}
                                    onChange={(e) => setSelectedFolderId(e.target.value)}
                                >
                                    <option value="">No Folder</option>
                                    {folders.map(folder => (
                                        <option key={folder.id} value={folder.id}>
                                            {folder.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Tags</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setIsCreatingTag(!isCreatingTag)}
                                >
                                    {isCreatingTag ? "Cancel" : "+ New Tag"}
                                </Button>
                            </div>

                            {isCreatingTag && (
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="Tag Name"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        className="h-9"
                                        disabled={isSavingTag}
                                    />
                                    <Button
                                        size="sm"
                                        disabled={isSavingTag || !newTagName.trim()}
                                        onClick={async () => {
                                            if (newTagName.trim()) {
                                                setIsSavingTag(true);
                                                try {
                                                    const newId = await onCreateTag(newTagName, "#3b82f6"); // Default blue
                                                    toggleTag(newId);
                                                    setNewTagName("");
                                                    setIsCreatingTag(false);
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Failed to create tag");
                                                } finally {
                                                    setIsSavingTag(false);
                                                }
                                            }
                                        }}
                                    >
                                        {isSavingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <div
                                        key={tag.id}
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-2 py-1 rounded-full text-xs cursor-pointer border transition-colors ${selectedTagIds.includes(tag.id)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background hover:bg-muted border-input"
                                            }`}
                                    >
                                        {tag.name}
                                    </div>
                                ))}
                                {tags.length === 0 && !isCreatingTag && <span className="text-sm text-muted-foreground">No tags available</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add some notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* AI Prompt section removed */}

                        <SheetFooter className="flex-col sm:flex-row gap-2">
                            {error && <p className="text-sm text-red-500 self-center mr-auto">{error}</p>}
                            <Button variant="outline" onClick={() => setStep('url')} disabled={isSavingVideo}>Back</Button>
                            <Button onClick={handleSave} disabled={isSavingVideo}>
                                {isSavingVideo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSavingVideo ? "Saving..." : "Save Video"}
                            </Button>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
