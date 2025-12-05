import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { FolderTree } from "./FolderTree";
import { TagManager } from "./TagManager";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus, Video, Scissors } from "lucide-react";

interface SidebarProps {
    folders: Folder[];
    tags: Tag[];
    selectedFolderId: string | null;
    selectedTagId: string | null;
    filterType: 'all' | 'video' | 'clip';
    onSelectFolder: (id: string | null) => void;
    onSelectTag: (id: string | null) => void;
    onSelectFilterType: (type: 'all' | 'video' | 'clip') => void;
    onCreateFolder: (name: string, parentId: string | null, category: 'video' | 'image') => void;
    onDeleteFolder: (id: string) => void;
    onRenameFolder: (id: string, newName: string) => void;
    onCreateTag: (name: string, color: string) => void;
    onDeleteTag: (id: string) => void;
}

export function Sidebar({
    folders,
    tags,
    selectedFolderId,
    selectedTagId,
    filterType,
    onSelectFolder,
    onSelectTag,
    onSelectFilterType,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
    onCreateTag,
    onDeleteTag,
}: SidebarProps) {
    const videoFolders = folders.filter(f => f.category === 'video' || !f.category); // Default to video if missing


    return (
        <div className="w-64 border-r bg-muted/10 h-full flex flex-col gap-6 p-4 overflow-y-auto">
            {/* Videos (Folders) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <h3>Videos</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCreateFolder("New Video Folder", null, 'video')}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <Button
                    variant={filterType === 'video' && selectedFolderId === null ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                        onSelectFilterType('video');
                        onSelectFolder(null);
                        onSelectTag(null);
                    }}
                >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    All Videos
                </Button>

                <FolderTree
                    folders={videoFolders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={(name, parentId) => onCreateFolder(name, parentId, 'video')}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFolder={onRenameFolder}
                />
            </div>

            {/* Clips (Tags) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Scissors className="w-4 h-4" />
                        <h3>Clips</h3>
                    </div>
                    {/* Tag creation is handled inside TagManager, but we can add a button here if needed. 
                        TagManager handles it. */}
                </div>

                <Button
                    variant={filterType === 'clip' && selectedTagId === null ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                        onSelectFilterType('clip');
                        onSelectFolder(null);
                        onSelectTag(null);
                    }}
                >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    All Clips
                </Button>

                <TagManager
                    tags={tags}
                    selectedTagId={selectedTagId}
                    onSelectTag={onSelectTag}
                    onCreateTag={onCreateTag}
                    onDeleteTag={onDeleteTag}
                />
            </div>
        </div>
    );
}
