import { useState } from "react";
import type { Tag } from "@/types/tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagManagerProps {
    tags: Tag[];
    selectedTagIds: string[];
    onSelectTag: (id: string | null) => void;
    onCreateTag: (name: string, color: string) => void;
    onDeleteTag: (id: string) => void;
}

const COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#a855f7", // purple
    "#ec4899", // pink
];

export function TagManager({ tags, selectedTagIds, onSelectTag, onCreateTag, onDeleteTag }: TagManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleCreate = () => {
        if (newTagName.trim()) {
            onCreateTag(newTagName, selectedColor);
            setNewTagName("");
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Tags</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsCreating(!isCreating)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {isCreating && (
                <div className="p-2 bg-muted/50 rounded-md space-y-2">
                    <Input
                        placeholder="Tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <div className="flex gap-1 flex-wrap">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                className={cn(
                                    "w-4 h-4 rounded-full transition-transform hover:scale-110",
                                    selectedColor === color && "ring-2 ring-offset-1 ring-primary"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                            />
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-6 text-xs" onClick={handleCreate}>
                            Create
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {tags.map(tag => (
                    <div
                        key={tag.id}
                        className={cn(
                            "flex items-center justify-between group px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50",
                            selectedTagIds.includes(tag.id) && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => onSelectTag(tag.id)}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                            <span className="text-sm truncate">{tag.name}</span>
                        </div>
                        {tag.user_id && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag.id);
                                }}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
