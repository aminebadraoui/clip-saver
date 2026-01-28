import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppData } from "@/context/AppDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Library, Video, Loader2 } from "lucide-react";
import { labApi, type LibraryTemplate } from "@/utils/labApi";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface InspirationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'title' | 'thumbnail' | 'outline';
    onSelect: (content: any) => void;
}

export const InspirationSidebar = ({ isOpen, onClose, type, onSelect }: InspirationSidebarProps) => {
    const { clips, tags } = useAppData();
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<'date' | 'viral' | 'score'>('date');
    const [showFilters, setShowFilters] = useState(false);
    const [source, setSource] = useState<'clips' | 'library'>('library'); // Default to library as requested

    // Library State
    const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [previewItem, setPreviewItem] = useState<LibraryTemplate | null>(null);

    useEffect(() => {
        if (isOpen && source === 'library') {
            fetchTemplates();
        }
    }, [isOpen, source, type]);

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const apiType = type === 'title' ? 'titles' : type === 'thumbnail' ? 'thumbnails' : 'scripts';
            const data = await labApi.listTemplates(apiType);
            setTemplates(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load library");
        } finally {
            setLoadingTemplates(false);
        }
    };

    // --- FILTERS STATE ---
    const [selectedVideoTags, setSelectedVideoTags] = useState<string[]>([]);
    const [selectedThumbnailTags, setSelectedThumbnailTags] = useState<string[]>([]);
    const [selectedTitleTags, setSelectedTitleTags] = useState<string[]>([]);

    const videoTags = tags.filter(t => t.category === 'video' || !t.category);
    // const thumbnailTags = tags.filter(t => t.category === 'thumbnail');
    // const titleTags = tags.filter(t => t.category === 'title');

    const toggleTag = (id: string, list: string[], setList: (ids: string[]) => void) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    const resetFilters = () => {
        setSelectedVideoTags([]);
        setSelectedThumbnailTags([]);
        setSelectedTitleTags([]);
    };

    const activeFilterCount = selectedVideoTags.length + selectedThumbnailTags.length + selectedTitleTags.length;


    // --- FILTER LOGIC ---

    // 1. Clips
    const filteredClips = clips.filter(clip => {
        if (search && !clip.title?.toLowerCase().includes(search.toLowerCase())) return false;

        const clipTagIds = clip.tagIds || [];
        if (selectedVideoTags.length > 0 && !selectedVideoTags.every(id => clipTagIds.includes(id))) return false;
        if (selectedThumbnailTags.length > 0 && !selectedThumbnailTags.every(id => clipTagIds.includes(id))) return false;
        if (selectedTitleTags.length > 0 && !selectedTitleTags.every(id => clipTagIds.includes(id))) return false;

        if (type === 'thumbnail' && !clip.thumbnail) return false;
        if (type === 'title' && !clip.title) return false;

        return true;
    }).sort((a, b) => {
        if (sortBy === 'date') return b.createdAt - a.createdAt;
        if (sortBy === 'viral') return (b.viralRatio || 0) - (a.viralRatio || 0);
        if (sortBy === 'score') return (b.engagementScore || 0) - (a.engagementScore || 0);
        return 0;
    });

    // 2. Templates
    const filteredTemplates = templates.filter(t => {
        const searchText = (t.text || t.structure || t.description || "").toLowerCase();
        if (search && !searchText.includes(search.toLowerCase())) return false;
        // Templates don't link to global tags yet in this simplified view, so skipping tag filters for now
        return true;
    }).sort((a, b) => b.createdAt - a.createdAt);


    const handleSelectTemplate = (template: LibraryTemplate) => {
        if (type === 'title') onSelect(template.text);
        else if (type === 'outline') onSelect({ type: 'structure', content: template.structure });
        else if (type === 'thumbnail') onSelect({ type: 'description', content: template.description });
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-[#0a0a0a] border-l border-white/10 sm:max-w-md">
                <SheetHeader className="mb-4 space-y-4">
                    <SheetTitle className="text-xl font-bold">
                        {type === 'title' ? "Title Inspiration" :
                            type === 'thumbnail' ? "Thumbnail Inspiration" : "Script Outline Inspiration"}
                    </SheetTitle>

                    {/* Source Toggle */}
                    <div className="flex p-1 bg-black/20 rounded-lg border border-white/10">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${source === 'library'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                }`}
                            onClick={() => setSource('library')}
                        >
                            <Library size={16} />
                            Library Templates
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${source === 'clips'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                }`}
                            onClick={() => setSource('clips')}
                        >
                            <Video size={16} />
                            From Videos
                        </button>
                    </div>
                </SheetHeader>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={source === 'library' ? "Search templates..." : "Search videos..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-white/5 border-white/10"
                        />
                    </div>

                    {source === 'clips' && (
                        <>
                            <Button
                                variant={showFilters || activeFilterCount > 0 ? "secondary" : "outline"}
                                size="icon"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex-shrink-0 relative border-white/10"
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
                                className="h-10 w-[110px] rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="date">Newest</option>
                                <option value="viral">Most Viral</option>
                                <option value="score">Best Score</option>
                            </select>
                        </>
                    )}
                </div>

                {/* Filters Panel (Clips Only) */}
                {source === 'clips' && showFilters && (
                    <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-2 border-b border-white/10 pb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Filters</span>
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs">Reset</Button>
                        </div>
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
                                            className="h-7 text-xs border-white/10"
                                        >
                                            {tag.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">

                    {/* --- LIBRARY MODE --- */}
                    {source === 'library' && (
                        loadingTemplates ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-xs">Loading templates...</span>
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No templates found.</p>
                                <p className="text-xs mt-1">Save items to your library to see them here.</p>
                            </div>
                        ) : (
                            filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="border border-white/5 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                                    onClick={() => setPreviewItem(template)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide font-medium">
                                                    {template.category || 'General'}
                                                </span>
                                            </div>

                                            {/* Content Display based on Type */}
                                            {type === 'title' && (
                                                <p className="font-medium text-gray-200 line-clamp-2">"{template.text}"</p>
                                            )}
                                            {type === 'outline' && (
                                                <div className="font-mono text-xs text-gray-300 line-clamp-4 bg-black/20 p-2 rounded border border-white/5">
                                                    {template.structure?.slice(0, 150)}...
                                                </div>
                                            )}
                                            {type === 'thumbnail' && (
                                                <p className="text-sm text-gray-300 line-clamp-3 italic">
                                                    {template.description}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            onClick={(e) => { e.stopPropagation(); handleSelectTemplate(template); }}
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {/* --- CLIPS MODE --- */}
                    {source === 'clips' && (
                        filteredClips.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No videos found matching filters.
                            </div>
                        ) : (
                            filteredClips.map(clip => (
                                <div key={clip.id} className="border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-colors group bg-black/20 hover:border-white/20">
                                    {type === 'thumbnail' ? (
                                        <div className="space-y-2">
                                            <div className="relative aspect-video rounded overflow-hidden border border-white/10">
                                                {clip.thumbnail ? (
                                                    <img src={clip.thumbnail} alt={clip.title} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="w-full h-full bg-black/40 flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    onClick={() => onSelect(clip.thumbnail)}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Add
                                                </Button>
                                            </div>
                                            <p className="text-xs font-medium line-clamp-1 text-gray-300">{clip.title}</p>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm line-clamp-2 text-gray-200">{clip.title}</p>
                                                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                                    <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                                                    {clip.viralRatio && <span className="text-green-400">Viral: {clip.viralRatio}x</span>}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-white"
                                                onClick={() => onSelect(type === 'outline' ? clip : clip.title)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </SheetContent>

            {/* PREVIEW DIALOG */}
            <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border-white/10">
                    <DialogHeader>
                        <DialogTitle>Template Preview</DialogTitle>
                        <DialogDescription>
                            Review the content before adding it to your brainstorming.
                        </DialogDescription>
                    </DialogHeader>

                    {previewItem && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary uppercase tracking-wide font-medium">
                                    {previewItem.category || 'General'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Added on {new Date(previewItem.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="p-4 bg-white/5 rounded-lg border border-white/10 whitespace-pre-wrap font-mono text-sm text-gray-200">
                                {type === 'title' && previewItem.text}
                                {type === 'outline' && previewItem.structure}
                                {type === 'thumbnail' && previewItem.description}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setPreviewItem(null)}>Close</Button>
                                <Button onClick={() => {
                                    handleSelectTemplate(previewItem);
                                    setPreviewItem(null);
                                }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Inspiration
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Sheet>
    );
};
