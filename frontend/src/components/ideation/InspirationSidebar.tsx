import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppData } from "@/context/AppDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

interface InspirationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'title' | 'thumbnail' | 'outline';
    onSelect: (content: any) => void; // content is string (title/outline) or object (thumbnail)
}

export const InspirationSidebar = ({ isOpen, onClose, type, onSelect }: InspirationSidebarProps) => {
    const { clips, tags } = useAppData();
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<'date' | 'viral' | 'score'>('date');
    const [showFilters, setShowFilters] = useState(false);

    // Multi-select states
    const [selectedVideoTags, setSelectedVideoTags] = useState<string[]>([]);
    const [selectedThumbnailTags, setSelectedThumbnailTags] = useState<string[]>([]);
    const [selectedTitleTags, setSelectedTitleTags] = useState<string[]>([]); // Optional, for title mode

    // Categorize tags
    const videoTags = tags.filter(t => t.category === 'video' || !t.category);
    const thumbnailTags = tags.filter(t => t.category === 'thumbnail');
    const titleTags = tags.filter(t => t.category === 'title');

    // Toggle logic
    const toggleTag = (id: string, list: string[], setList: (ids: string[]) => void) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    // Filter logic
    const filteredClips = clips.filter(clip => {
        // Basic search
        if (search && !clip.title?.toLowerCase().includes(search.toLowerCase())) return false;

        const clipTagIds = clip.tagIds || [];

        // Video Tags (AND logic: clip must have ALL selected video tags)
        if (selectedVideoTags.length > 0) {
            const hasAll = selectedVideoTags.every(id => clipTagIds.includes(id));
            if (!hasAll) return false;
        }

        // Thumbnail Tags (AND logic)
        // Only enforce if we are in thumbnail mode OR if user just wants to filter by thumbnail tags generally? 
        // User asked "when I add a thumbnail inspiration", so mostly relevant there.
        // But if I select a thumbnail tag, I expect clips that have it.
        if (selectedThumbnailTags.length > 0) {
            const hasAll = selectedThumbnailTags.every(id => clipTagIds.includes(id));
            if (!hasAll) return false;
        }

        // Title Tags (AND logic)
        if (selectedTitleTags.length > 0) {
            const hasAll = selectedTitleTags.every(id => clipTagIds.includes(id));
            if (!hasAll) return false;
        }

        // Feature type check
        if (type === 'thumbnail' && !clip.thumbnail) return false;
        if (type === 'title' && !clip.title) return false;

        return true;
    }).sort((a, b) => {
        if (sortBy === 'date') return b.createdAt - a.createdAt;
        if (sortBy === 'viral') return (b.viralRatio || 0) - (a.viralRatio || 0);
        if (sortBy === 'score') return (b.engagementScore || 0) - (a.engagementScore || 0);
        return 0;
    });

    const resetFilters = () => {
        setSelectedVideoTags([]);
        setSelectedThumbnailTags([]);
        setSelectedTitleTags([]);
    };

    const activeFilterCount = selectedVideoTags.length + selectedThumbnailTags.length + selectedTitleTags.length;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="mb-4">
                    <SheetTitle>
                        {type === 'title' ? "Title Inspiration" :
                            type === 'thumbnail' ? "Thumbnail Inspiration" : "Script Outline Inspiration"}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <Button
                        variant={showFilters || activeFilterCount > 0 ? "secondary" : "outline"}
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex-shrink-0 relative"
                    >
                        <Filter className="w-4 h-4" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="date">Date Added</option>
                        <option value="viral">Viral Ratio</option>
                        <option value="score">Engagement</option>
                    </select>
                </div>

                {/* Tags Filter Sections */}
                {showFilters && (
                    <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2 border-b pb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Filters</span>
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs">Reset</Button>
                        </div>

                        {/* Video Tags */}
                        {videoTags.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Video Tags</p>
                                <div className="flex gap-2 flex-wrap">
                                    {videoTags.map(tag => (
                                        <Button
                                            key={tag.id}
                                            variant={selectedVideoTags.includes(tag.id) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleTag(tag.id, selectedVideoTags, setSelectedVideoTags)}
                                            className="h-7 text-xs"
                                        >
                                            {tag.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Thumbnail Tags (Only show if type is thumbnail or we stick to showing all?)
                        User asked specifically for this context. I will show them if they exist.
                    */}
                        {type === 'thumbnail' && thumbnailTags.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Thumbnail Tags</p>
                                <div className="flex gap-2 flex-wrap">
                                    {thumbnailTags.map(tag => (
                                        <Button
                                            key={tag.id}
                                            variant={selectedThumbnailTags.includes(tag.id) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleTag(tag.id, selectedThumbnailTags, setSelectedThumbnailTags)}
                                            className="h-7 text-xs border-primary/20"
                                        >
                                            {tag.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Title Tags (Optional, but good for completeness) */}
                        {type === 'title' && titleTags.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Title Tags</p>
                                <div className="flex gap-2 flex-wrap">
                                    {titleTags.map(tag => (
                                        <Button
                                            key={tag.id}
                                            variant={selectedTitleTags.includes(tag.id) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleTag(tag.id, selectedTitleTags, setSelectedTitleTags)}
                                            className="h-7 text-xs border-primary/20"
                                        >
                                            {tag.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredClips.map(clip => (
                        <div key={clip.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group">
                            {type === 'thumbnail' ? (
                                <div className="space-y-2">
                                    <div className="relative aspect-video rounded overflow-hidden">
                                        <img src={clip.thumbnail} alt={clip.title} className="object-cover w-full h-full" />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onSelect(clip.thumbnail)}
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                    <p className="text-sm font-medium line-clamp-1">{clip.title}</p>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm line-clamp-2">{clip.title}</p>
                                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                                            {clip.viralRatio && <span>Viral: {clip.viralRatio}x</span>}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onSelect(type === 'outline' ? clip : clip.title)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredClips.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No clips found matching filters.
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
