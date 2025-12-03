import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import type { Clip } from "@/types/clip";

interface SaveClipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (metadata: any) => void;
    folders: Folder[];
    tags: Tag[];
    clips: Clip[];
}

export function SaveClipModal({ isOpen, onClose, onSave, folders, tags, clips }: SaveClipModalProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string>("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [prompt, setPrompt] = useState("");

    useEffect(() => {
        if (isOpen) {
            // Reset form or pre-fill if needed
            setSelectedFolderId("");
            setSelectedTagIds([]);
            setNotes("");
            setPrompt("");
        }
    }, [isOpen]);

    const handleSave = () => {
        onSave({
            folderId: selectedFolderId || null,
            tagIds: selectedTagIds,
            notes,
            aiPrompt: prompt,
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
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {clips.map(clip => (
                            <div key={clip.id} className="flex-shrink-0 w-32 space-y-1">
                                <img
                                    src={clip.thumbnail}
                                    alt={clip.title}
                                    className="w-32 h-20 object-cover rounded-md bg-muted"
                                />
                                <p className="text-xs truncate text-muted-foreground">{clip.title}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
