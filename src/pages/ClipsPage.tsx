import { useState, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";
import {
    getClips,
    deleteClip,
    getFolders,
    saveFolder,
    deleteFolder,
    updateFolder,
    getTags,
    saveTag,
    deleteTag,
    updateClip,
    initializeFolders,
    saveClip
} from "@/utils/storage";
import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { ClipCard } from "@/components/ClipCard";
import { Sidebar } from "@/components/Sidebar";
import { AddVideoSheet } from "@/components/AddVideoSheet";
import { CinemaModeModal } from "@/components/CinemaModeModal";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, ArrowUpDown, TrendingUp } from "lucide-react";
import { ClipListRow } from "@/components/ClipListRow";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function ClipsPage() {
    const [clips, setClips] = useState<Clip[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'video' | 'clip'>('video');
    const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
    const [quickAddUrl, setQuickAddUrl] = useState("");

    // New UX State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'date' | 'viralRatio' | 'timeRatio' | 'engagementScore'>('date');
    const [selectedClipForCinema, setSelectedClipForCinema] = useState<Clip | null>(null);

    useEffect(() => {
        const init = async () => {
            await initializeFolders();
            await refreshData();
        };
        init();
    }, []);

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

        const filterParam = params.get('filter');
        if (filterParam === 'clip') {
            setFilterType('clip');
            // Clear param
            window.history.replaceState({}, '', '/');
        }
    }, []);

    const refreshData = async () => {
        setClips(await getClips());
        setFolders(await getFolders());
        setTags(await getTags());
    };

    const handleDeleteClip = async (id: string) => {
        await deleteClip(id);
        await refreshData();
    };

    const handleUpdateClip = async (updatedClip: Clip) => {
        await updateClip(updatedClip);
        await refreshData();
    };

    // Folder handlers
    const handleCreateFolder = async (name: string, parentId: string | null, category: 'video' | 'image' = 'video') => {
        // Check for duplicates
        const duplicate = folders.find(f => f.name.toLowerCase() === name.toLowerCase() && f.parentId === parentId);
        if (duplicate) {
            toast.error(`Folder "${name}" already exists.`);
            throw new Error("Folder already exists");
        }

        const id = uuidv4();
        const newFolder: Folder = {
            id,
            name,
            parentId,
            category,
            createdAt: Date.now(),
        };
        await saveFolder(newFolder);
        await refreshData();
        return id;
    };

    const handleDeleteFolder = async (id: string) => {
        if (confirm("Are you sure you want to delete this folder? Subfolders will be deleted and clips moved to root.")) {
            await deleteFolder(id);
            await refreshData();
            if (selectedFolderId === id) setSelectedFolderId(null);
        }
    };

    const handleRenameFolder = async (id: string, newName: string) => {
        const folder = folders.find(f => f.id === id);
        if (folder) {
            await updateFolder({ ...folder, name: newName });
            await refreshData();
        }
    };

    // Tag handlers
    const handleCreateTag = async (name: string, color: string) => {
        // Check for duplicates
        const duplicate = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
            toast.error(`Tag "${name}" already exists.`);
            throw new Error("Tag already exists");
        }

        const id = uuidv4();
        const newTag: Tag = {
            id,
            name,
            color,
            createdAt: Date.now(),
        };
        await saveTag(newTag);
        await refreshData();
        return id;
    };

    const handleDeleteTag = async (id: string) => {
        if (confirm("Are you sure you want to delete this tag?")) {
            await deleteTag(id);
            await refreshData();
            if (selectedTagId === id) setSelectedTagId(null);
        }
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
        // Update local state immediately to avoid refresh requirement
        setClips(prev => [newVideo, ...prev]);
        setQuickAddUrl(""); // Clear input
        // Also refresh full data to be safe
        await refreshData();
    };



    // Selection handlers
    const handleSelectFolder = (id: string | null) => {
        setSelectedFolderId(id);
        setSelectedTagId(null); // Mutually exclusive for now
        if (id) {
            setFilterType('video');
        }
    };

    const handleSelectTag = (id: string | null) => {
        setSelectedTagId(id);
        setSelectedFolderId(null);
        if (id) {
            setFilterType('clip');
        }
    };

    // Filtering
    const filteredClips = clips.filter(clip => {
        if (selectedFolderId) {
            return clip.folderId === selectedFolderId;
        }
        if (selectedTagId) {
            return clip.tagIds?.includes(selectedTagId);
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
        if (selectedTagId) {
            // Tags are for clips
            return type === 'clip';
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
        <div className="flex h-[calc(100vh-4rem)] -m-6">
            <Sidebar
                folders={folders}
                tags={tags}
                selectedFolderId={selectedFolderId}
                selectedTagId={selectedTagId}
                filterType={filterType}
                onSelectFolder={handleSelectFolder}
                onSelectTag={handleSelectTag}
                onSelectFilterType={setFilterType}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={handleDeleteFolder}
                onRenameFolder={handleRenameFolder}
                onCreateTag={handleCreateTag}
                onDeleteTag={handleDeleteTag}
            />

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {selectedFolderId
                                ? folders.find(f => f.id === selectedFolderId)?.name
                                : selectedTagId
                                    ? `Tag: ${tags.find(t => t.id === selectedTagId)?.name}`
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

                    {filteredClips.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                            <h3 className="text-xl font-medium text-muted-foreground mb-4">No videos found</h3>
                            <p className="text-muted-foreground mb-8">
                                {selectedFolderId || selectedTagId
                                    ? "This folder/tag is empty."
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
                </div>
            </div>

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
        </div >
    );
}
