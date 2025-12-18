import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/AuthContext";
import type { Clip } from "@/types/clip";
import type { Tag } from "@/types/tag";
import {
    getClips,
    getTags,
    saveTag,
    deleteTag
} from "@/utils/storage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface AppDataContextType {
    clips: Clip[];

    tags: Tag[];

    selectedTagIds: string[];
    filterType: 'all' | 'video' | 'clip';
    isLoading: boolean;

    // Actions
    refreshData: () => Promise<void>;

    setSelectedTagIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setFilterType: (type: 'all' | 'video' | 'clip') => void;

    // Derived Actions (Higher level)

    handleSelectTag: (id: string | null) => void;

    // CRUD wrappers

    handleCreateTag: (name: string, color: string, category?: string) => Promise<string>;
    handleDeleteTag: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const { currentSpace } = useAuth();
    const [clips, setClips] = useState<Clip[]>([]);

    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State

    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'video' | 'clip'>('video');

    const refreshData = useCallback(async () => {
        const [loadedClips, loadedTags] = await Promise.all([
            getClips(),
            getTags()
        ]);
        setClips(loadedClips);
        setTags(loadedTags);
    }, []);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);

            await refreshData();
            setIsLoading(false);
        };
        init();

        // Also listen for URL params that might affect state (e.g. from redirect)
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter');
        if (filterParam === 'clip') {
            setFilterType('clip');
            // Clean up URL handled by consumer or just leave it, but we set state here.
        }
    }, [refreshData, currentSpace]);



    const handleSelectTag = (id: string | null) => {
        if (id === null) {
            setSelectedTagIds([]);
            return;
        }


        setSelectedTagIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(t => t !== id);
            } else {
                return [...prev, id];
            }
        });
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
            tags,
            selectedTagIds,
            filterType,
            isLoading,
            refreshData,
            setSelectedTagIds,
            setFilterType,
            handleSelectTag,
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
