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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";


export function ClipsPage() {
    const [clips, setClips] = useState<Clip[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'video' | 'clip'>('all');
    const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
    const [quickAddUrl, setQuickAddUrl] = useState("");

    useEffect(() => {
        initializeFolders();
        refreshData();
    }, []);

    const refreshData = () => {
        setClips(getClips());
        setFolders(getFolders());
        setTags(getTags());
    };

    const handleDeleteClip = (id: string) => {
        deleteClip(id);
        refreshData();
    };

    const handleUpdateClip = (updatedClip: Clip) => {
        updateClip(updatedClip);
        refreshData();
    };

    // Folder handlers
    const handleCreateFolder = (name: string, parentId: string | null, category: 'video' | 'image' = 'video') => {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            parentId,
            category,
            createdAt: Date.now(),
        };
        saveFolder(newFolder);
        refreshData();
    };

    const handleDeleteFolder = (id: string) => {
        if (confirm("Are you sure you want to delete this folder? Subfolders will be deleted and clips moved to root.")) {
            deleteFolder(id);
            refreshData();
            if (selectedFolderId === id) setSelectedFolderId(null);
        }
    };

    const handleRenameFolder = (id: string, newName: string) => {
        const folder = folders.find(f => f.id === id);
        if (folder) {
            updateFolder({ ...folder, name: newName });
            refreshData();
        }
    };

    // Tag handlers
    const handleCreateTag = (name: string, color: string) => {
        const newTag: Tag = {
            id: uuidv4(),
            name,
            color,
            createdAt: Date.now(),
        };
        saveTag(newTag);
        refreshData();
    };

    const handleDeleteTag = (id: string) => {
        if (confirm("Are you sure you want to delete this tag?")) {
            deleteTag(id);
            refreshData();
            if (selectedTagId === id) setSelectedTagId(null);
        }
    };

    // Video/Clip handlers
    const handleSaveVideo = (videoData: any) => {
        const newVideo: Clip = {
            id: uuidv4(),
            type: 'video',
            createdAt: Date.now(),
            ...videoData
        };
        saveClip(newVideo);
        // Update local state immediately to avoid refresh requirement
        setClips(prev => [newVideo, ...prev]);
        setQuickAddUrl(""); // Clear input
    };

    const handleQuickAdd = () => {
        if (quickAddUrl.trim()) {
            setIsAddVideoModalOpen(true);
        }
    };

    // Selection handlers
    const handleSelectFolder = (id: string | null) => {
        setSelectedFolderId(id);
        setSelectedTagId(null); // Mutually exclusive for now, or could be combined
    };

    const handleSelectTag = (id: string | null) => {
        setSelectedTagId(id);
        setSelectedFolderId(null);
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
        if (filterType === 'all') return true;

        // Improved legacy handling:
        // If type is explicitly set, use it.
        // If not, check if it has start/end times. If so, it's a clip.
        // Otherwise, treat as video.
        let type = clip.type;
        if (!type) {
            if (typeof clip.start === 'number' && typeof clip.end === 'number') {
                type = 'clip';
            } else {
                type = 'video';
            }
        }

        return type === filterType;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6">
            <Sidebar
                folders={folders}
                tags={tags}
                selectedFolderId={selectedFolderId}
                selectedTagId={selectedTagId}
                onSelectFolder={handleSelectFolder}
                onSelectTag={handleSelectTag}
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
                                    : "All Videos"}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                                <Button
                                    variant={filterType === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filterType === 'video' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType('video')}
                                >
                                    Videos
                                </Button>
                                <Button
                                    variant={filterType === 'clip' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType('clip')}
                                >
                                    Clips
                                </Button>
                            </div>
                            <div className="flex gap-2 w-80">
                                <Input
                                    placeholder="Paste YouTube URL..."
                                    value={quickAddUrl}
                                    onChange={(e) => setQuickAddUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                                    className="bg-background"
                                />
                                <Button onClick={handleQuickAdd} disabled={!quickAddUrl.trim()}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClips.map((clip) => (
                                <ClipCard
                                    key={clip.id}
                                    clip={clip}
                                    folders={folders}
                                    tags={tags}
                                    onDelete={handleDeleteClip}
                                    onUpdate={handleUpdateClip}
                                />
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
                tags={tags}
                initialUrl={quickAddUrl}
            />
        </div>
    );
}
