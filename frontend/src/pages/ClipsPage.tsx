import { useState, useEffect } from "react";
import { useAppData } from "@/context/AppDataContext";
import {
    saveClip,
    deleteClip,
    updateClip
} from "@/utils/storage";
import type { Clip } from "@/types/clip";
import { ClipCard } from "@/components/ClipCard";
import { AddVideoSheet } from "@/components/AddVideoSheet";
import { CinemaModeModal } from "@/components/CinemaModeModal";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, ArrowUpDown, TrendingUp } from "lucide-react";
import { ClipListRow } from "@/components/ClipListRow";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";


export function ClipsPage() {
    const {
        clips, folders, tags,
        selectedFolderId, selectedTagIds, filterType,
        isLoading,
        refreshData,
        handleCreateFolder,
        handleCreateTag
    } = useAppData();

    const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
    const [quickAddUrl, setQuickAddUrl] = useState("");

    // New UX State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'date' | 'viralRatio' | 'timeRatio' | 'engagementScore'>('date');
    const [selectedClipForCinema, setSelectedClipForCinema] = useState<Clip | null>(null);

    // Check for addVideo query param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const addVideoUrl = params.get('addVideo');
        if (addVideoUrl) {
            setQuickAddUrl(addVideoUrl);
            setIsAddVideoModalOpen(true);
            // Clean up URL
            window.history.replaceState({}, '', '/');
        }
    }, []);

    const handleDeleteClip = async (id: string) => {
        await deleteClip(id);
        await refreshData();
    };

    const handleUpdateClip = async (updatedClip: Clip) => {
        await updateClip(updatedClip);
        await refreshData();
    };

    // Video/Clip handlers
    const handleSaveVideo = async (videoData: any) => {
        const newVideo: Clip = {
            id: uuidv4(),
            type: 'video',
            createdAt: Date.now(),
            ...videoData
        };
        await saveClip(newVideo);
        setQuickAddUrl(""); // Clear input
        await refreshData();
    };


    // Filtering
    const filteredClips = clips.filter(clip => {
        if (selectedFolderId) {
            return clip.folderId === selectedFolderId;
        }

        if (selectedTagIds.length > 0) {
            if (!clip.tagIds) return false;
            // AND logic: Clip must have ALL selected tags
            const hasAllTags = selectedTagIds.every(tagId => clip.tagIds?.includes(tagId));
            return hasAllTags;
        }

        return true;
    }).filter(clip => {
        // If specific folder/tag selected, we already filtered by it.
        // But we should also respect the implicit type of that selection if we want strictness.
        // However, the requirement is mainly about the top-level "All Videos" vs "All Clips".

        // Determine clip type
        let type = clip.type;
        if (!type) {
            if (typeof clip.start === 'number' && typeof clip.end === 'number') {
                type = 'clip';
            } else {
                type = 'video';
            }
        }

        if (selectedFolderId) {
            // Folders are for videos
            return type === 'video';
        }

        // If no selection, strictly follow filterType
        if (filterType === 'all') return true;
        return type === filterType;
    });

    const sortedClips = [...filteredClips].sort((a, b) => {
        if (sortBy === 'date') return b.createdAt - a.createdAt;
        if (sortBy === 'viralRatio') return (b.viralRatio || 0) - (a.viralRatio || 0);
        if (sortBy === 'timeRatio') return (b.timeSinceUploadRatio || 0) - (a.timeSinceUploadRatio || 0);
        if (sortBy === 'engagementScore') return (b.engagementScore || 0) - (a.engagementScore || 0);
        return 0;
    });

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">
                    {selectedFolderId
                        ? folders.find(f => f.id === selectedFolderId)?.name
                        : selectedTagIds.length > 0
                            ? `Tags: ${selectedTagIds.map(id => tags.find(t => t.id === id)?.name).filter(Boolean).join(", ")}`
                            : filterType === 'video' ? "All Videos" : "All Clips"}
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortBy('date')}>
                                Date Added
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('viralRatio')}>
                                Viral Ratio (Views/Subs)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('timeRatio')}>
                                Velocity (Views/Time)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('engagementScore')}>
                                Engagement Score
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant={sortBy === 'engagementScore' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => setSortBy('engagementScore')}
                    >
                        <TrendingUp className="h-4 w-4" />
                        Top Performing
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }>
                    {Array.from({ length: 6 }).map((_, i) => (
                        viewMode === 'grid' ? (
                            <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="h-[200px] w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ) : (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : filteredClips.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                    <h3 className="text-xl font-medium text-muted-foreground mb-4">No videos found</h3>
                    <p className="text-muted-foreground mb-8">
                        {selectedFolderId || selectedTagIds.length > 0
                            ? "This folder/tag filter is empty."
                            : "Get started by adding your first video."}
                    </p>
                </div>
            ) : (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }>
                    {sortedClips.map((clip) => (
                        viewMode === 'grid' ? (
                            <ClipCard
                                key={clip.id}
                                clip={clip}
                                originalVideo={clip.sourceVideoId ? clips.find(c => c.id === clip.sourceVideoId) : null}
                                folders={folders}
                                tags={tags}
                                onDelete={handleDeleteClip}
                                onUpdate={handleUpdateClip}
                                onCinemaMode={setSelectedClipForCinema}
                            />
                        ) : (
                            <ClipListRow
                                key={clip.id}
                                clip={clip}
                                folders={folders}
                                tags={tags}
                                onDelete={handleDeleteClip}
                                onCinemaMode={setSelectedClipForCinema}
                            />
                        )
                    ))}
                </div>
            )}


            <AddVideoSheet
                isOpen={isAddVideoModalOpen}
                onClose={() => setIsAddVideoModalOpen(false)}
                onSave={handleSaveVideo}
                folders={folders}
                initialUrl={quickAddUrl}
                onCreateFolder={handleCreateFolder}
                clips={clips}
            />

            <CinemaModeModal
                isOpen={!!selectedClipForCinema}
                onClose={() => setSelectedClipForCinema(null)}
                clip={selectedClipForCinema}
                originalVideo={selectedClipForCinema?.sourceVideoId ? clips.find(c => c.id === selectedClipForCinema.sourceVideoId) : null}
                onUpdateClip={handleUpdateClip}
                tags={tags}
                onCreateTag={handleCreateTag}
                onClipsSaved={refreshData}
                onSwitchToClip={(clipId) => {
                    const video = clips.find(c => c.id === clipId);
                    if (video) {
                        setSelectedClipForCinema(video);
                    } else {
                        toast.error("Original video not found");
                    }
                }}
            />
        </>
    );
}

