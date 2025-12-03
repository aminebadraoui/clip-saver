import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    updateClip
} from "@/utils/storage";
import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { ClipCard } from "@/components/ClipCard";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ClipsPage() {
    const [clips, setClips] = useState<Clip[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

    useEffect(() => {
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
    const handleCreateFolder = (name: string, parentId: string | null) => {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            parentId,
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
                                    : "All Clips"}
                        </h1>
                        <Button asChild size="lg">
                            <Link to="/create">
                                <Plus className="w-5 h-5 mr-2" /> Create New Clip
                            </Link>
                        </Button>
                    </div>

                    {filteredClips.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                            <h3 className="text-xl font-medium text-muted-foreground mb-4">No clips found</h3>
                            <p className="text-muted-foreground mb-8">
                                {selectedFolderId || selectedTagId
                                    ? "This folder/tag is empty."
                                    : "Paste a YouTube link to start creating segments."}
                            </p>
                            {!selectedFolderId && !selectedTagId && (
                                <Button asChild>
                                    <Link to="/create">Get Started</Link>
                                </Button>
                            )}
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
        </div>
    );
}
