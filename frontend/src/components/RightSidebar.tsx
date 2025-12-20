import { useState } from "react";
import type { Tag } from "@/types/tag";
import { cn } from "@/lib/utils";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { saveTag, deleteTag } from "@/utils/storage";

interface RightSidebarProps {
    tags: Tag[];
    selectedTagIds: string[];
    onSelectTag: (id: string | null) => void;
    onRefetchTags?: () => void;
    isLoading?: boolean;
}

export function RightSidebar({ tags, selectedTagIds, onSelectTag, onRefetchTags, isLoading = false }: RightSidebarProps) {
    const videoTags = tags.filter(t => t.category === 'video' || !t.category);
    const titleTags = tags.filter(t => t.category === 'title');
    const thumbnailTags = tags.filter(t => t.category === 'thumbnail');

    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState("");

    const handleAddTag = async (category: string) => {
        if (!newTagName.trim()) return;

        try {
            await saveTag({
                name: newTagName,
                color: "#71717a", // Default gray
                category: category,
                createdAt: Date.now(),
                id: "" // Backend generates ID
            } as Tag);
            setNewTagName("");
            setIsAdding(null);
            if (onRefetchTags) onRefetchTags();
        } catch (e) {
            console.error("Failed to add tag", e);
        }
    };

    const handleDeleteTag = async (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation(); // Prevent selection when deleting
        if (!confirm("Are you sure you want to delete this tag?")) return;

        try {
            await deleteTag(tagId);
            if (onRefetchTags) onRefetchTags();
        } catch (e) {
            console.error("Failed to delete tag", e);
            alert("Failed to delete tag. You might not have permission to delete global tags.");
        }
    };

    const renderTagList = (sectionTags: Tag[], title: string, categoryKey: string) => (
        <div className="flex flex-col h-1/3 min-h-0 border-b last:border-0 relative group/section">
            <div className="px-4 py-3 border-b bg-muted/5 sticky top-0 backdrop-blur-sm z-10 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/section:opacity-100 transition-opacity"
                    onClick={() => setIsAdding(categoryKey)}
                    disabled={isLoading}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {isAdding === categoryKey && (
                <div className="px-3 py-2 border-b bg-background">
                    <div className="flex gap-2">
                        <Input
                            autoFocus
                            placeholder="Tag name..."
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTag(categoryKey);
                                if (e.key === 'Escape') setIsAdding(null);
                            }}
                            className="h-8 text-sm"
                        />
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setIsAdding(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="p-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {isLoading ? (
                    <div className="space-y-2 p-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2 w-full">
                                    <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sectionTags.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 italic text-center">No tags</div>
                ) : (
                    <div className="space-y-1">
                        {sectionTags.map(tag => (
                            <div
                                key={tag.id}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group/tag",
                                    selectedTagIds.includes(tag.id) && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => onSelectTag(tag.id)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                    <span className="text-sm truncate leading-none">{tag.name}</span>
                                </div>
                                {tag.user_id && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover/tag:opacity-100 transition-opacity -mr-2 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={(e) => handleDeleteTag(e, tag.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-64 border-l bg-muted/10 h-full flex flex-col">
            {renderTagList(videoTags, "Video Format", "video")}
            {renderTagList(titleTags, "Title", "title")}
            {renderTagList(thumbnailTags, "Thumbnail", "thumbnail")}
        </div>
    );
}
