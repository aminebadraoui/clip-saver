import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Tag } from "@/types/tag";
import type { Clip } from "@/types/clip";

interface SaveClipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (metadata: any) => void;
    tags: Tag[];
    clips: Clip[];
}

export function SaveClipModal({ isOpen, onClose, onSave, tags, clips }: SaveClipModalProps) {
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [prompt, setPrompt] = useState("");
    const [clipTitles, setClipTitles] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            // Reset form or pre-fill if needed
            setNotes("");
            setPrompt("");

            const titles: Record<string, string> = {};
            clips.forEach(c => titles[c.id] = c.title);
            setClipTitles(titles);

            // We no longer automatically select global tags as requested
            setSelectedTagIds([]);
        }
    }, [isOpen, clips]);

    const handleSave = () => {
        onSave({
            // folderId: null, // Removed
            tagIds: selectedTagIds,
            notes,
            aiPrompt: prompt,
            clipTitles,
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

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Save {clips.length > 1 ? `${clips.length} Clips` : "Clip"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Preview of clips */}
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {clips.map(clip => (
                            <div key={clip.id} className="flex-shrink-0 w-48 space-y-2">
                                <img
                                    src={clip.thumbnail}
                                    alt={clip.title}
                                    className="w-full h-28 object-cover rounded-md bg-muted"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor={`title-${clip.id}`} className="text-xs">Title</Label>
                                    <input
                                        id={`title-${clip.id}`}
                                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={clipTitles[clip.id] || clip.title}
                                        onChange={(e) => setClipTitles(prev => ({ ...prev, [clip.id]: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ))}
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
                            placeholder="Add notes for these clips..."
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

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save Clips</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
