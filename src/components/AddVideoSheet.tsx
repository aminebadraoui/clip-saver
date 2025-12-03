import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { Loader2 } from "lucide-react";

interface AddVideoSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (videoData: any) => void;
    folders: Folder[];
    tags: Tag[];
    initialUrl?: string;
}

export function AddVideoSheet({ isOpen, onClose, onSave, folders, tags, initialUrl = "" }: AddVideoSheetProps) {
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
    const [prompt, setPrompt] = useState("");

    const resetForm = () => {
        setUrl(initialUrl);
        setStep('url');
        setTitle("");
        setThumbnail("");
        setVideoId("");
        setSelectedFolderId("");
        setSelectedTagIds([]);
        setNotes("");
        setPrompt("");
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
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
            setStep('details');
        } catch (error) {
            console.error(error);
            alert("Failed to load video details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        onSave({
            videoId,
            title,
            thumbnail,
            folderId: selectedFolderId || null,
            tagIds: selectedTagIds,
            notes,
            aiPrompt: prompt,
            originalVideoUrl: url,
        });
        onClose();
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
                                Fetch Details
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
                        </div>

                        <div className="space-y-2">
                            <Label>Folder</Label>
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
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
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
                                {tags.length === 0 && <span className="text-sm text-muted-foreground">No tags available</span>}
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

                        <div className="space-y-2">
                            <Label htmlFor="prompt">AI Prompt</Label>
                            <Textarea
                                id="prompt"
                                placeholder="Prompt for future processing..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>

                        <SheetFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setStep('url')}>Back</Button>
                            <Button onClick={handleSave}>Save Video</Button>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
