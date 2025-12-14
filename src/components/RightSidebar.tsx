import type { Tag } from "@/types/tag";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
    tags: Tag[];
    selectedTagIds: string[];
    onSelectTag: (id: string | null) => void;
}

export function RightSidebar({ tags, selectedTagIds, onSelectTag }: RightSidebarProps) {
    const videoTags = tags.filter(t => t.category === 'video' || !t.category);
    const titleTags = tags.filter(t => t.category === 'title');
    const thumbnailTags = tags.filter(t => t.category === 'thumbnail');

    const renderTagList = (sectionTags: Tag[], title: string) => (
        <div className="flex flex-col h-1/3 min-h-0 border-b last:border-0">
            <div className="px-4 py-3 border-b bg-muted/5 sticky top-0 backdrop-blur-sm z-10">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
                {sectionTags.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 italic text-center">No tags</div>
                ) : (
                    <div className="space-y-1">
                        {sectionTags.map(tag => (
                            <div
                                key={tag.id}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                                    selectedTagIds.includes(tag.id) && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => onSelectTag(tag.id)}
                            >
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                <span className="text-sm truncate leading-none">{tag.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-64 border-l bg-muted/10 h-full flex flex-col">
            {renderTagList(videoTags, "Video Format")}
            {renderTagList(titleTags, "Title")}
            {renderTagList(thumbnailTags, "Thumbnail")}
        </div>
    );
}
