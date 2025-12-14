import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import {
    getClips,
    getFolders,
    getTags,
    saveFolder,
    deleteFolder,
    updateFolder,
    saveTag,
    deleteTag,
    initializeFolders
} from "@/utils/storage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface AppDataContextType {
    clips: Clip[];
    folders: Folder[];
    tags: Tag[];
    selectedFolderId: string | null;
    selectedTagIds: string[];
    filterType: 'all' | 'video' | 'clip';

    // Actions
    refreshData: () => Promise<void>;
    setSelectedFolderId: (id: string | null) => void;
    setSelectedTagIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setFilterType: (type: 'all' | 'video' | 'clip') => void;

    // Derived Actions (Higher level)
    handleSelectFolder: (id: string | null) => void;
    handleSelectTag: (id: string | null) => void;

    // CRUD wrappers
    handleCreateFolder: (name: string, parentId: string | null, category?: 'video' | 'image') => Promise<string>;
    handleDeleteFolder: (id: string) => Promise<void>;
    handleRenameFolder: (id: string, newName: string) => Promise<void>;
    handleCreateTag: (name: string, color: string, category?: string) => Promise<string>;
    handleDeleteTag: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const [clips, setClips] = useState<Clip[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    // State
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'video' | 'clip'>('video');

    const refreshData = useCallback(async () => {
        const [loadedClips, loadedFolders, loadedTags] = await Promise.all([
            getClips(),
            getFolders(),
            getTags()
        ]);
        setClips(loadedClips);
        setFolders(loadedFolders);
        setTags(loadedTags);
    }, []);

    useEffect(() => {
        const init = async () => {
            await initializeFolders();
            await refreshData();
        };
        init();

        // Also listen for URL params that might affect state (e.g. from redirect)
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter');
        if (filterParam === 'clip') {
            setFilterType('clip');
            // Clean up URL handled by consumer or just leave it, but we set state here.
        }
    }, [refreshData]);

    const handleSelectFolder = (id: string | null) => {
        setSelectedFolderId(id);
        setSelectedTagIds([]); // Clear tags when selecting folder
        if (id) setFilterType('video');
    };

    const handleSelectTag = (id: string | null) => {
        if (id === null) {
            setSelectedTagIds([]);
            return;
        }

        setSelectedFolderId(null);
        setSelectedTagIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(t => t !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Folder Actions
    const handleCreateFolder = async (name: string, parentId: string | null, category: 'video' | 'image' = 'video') => {
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

    // Tag Actions
    const handleCreateTag = async (name: string, color: string, category: string = 'video') => {
        const duplicate = tags.find(t => t.name.toLowerCase() === name.toLowerCase() && (t.category || 'video') === category);
        if (duplicate) {
            toast.error(`Tag "${name}" already exists in ${category}.`);
            throw new Error("Tag already exists");
        }

        const id = uuidv4();
        const newTag: Tag = {
            id,
            name,
            color,
            category,
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
            if (selectedTagIds.includes(id)) {
                setSelectedTagIds(prev => prev.filter(t => t !== id));
            }
        }
    };

    return (
        <AppDataContext.Provider value={{
            clips,
            folders,
            tags,
            selectedFolderId,
            selectedTagIds,
            filterType,
            refreshData,
            setSelectedFolderId,
            setSelectedTagIds,
            setFilterType,
            handleSelectFolder,
            handleSelectTag,
            handleCreateFolder,
            handleDeleteFolder,
            handleRenameFolder,
            handleCreateTag,
            handleDeleteTag
        }}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
}
