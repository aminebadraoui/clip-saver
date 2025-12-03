import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { FolderTree } from "./FolderTree";
import { TagManager } from "./TagManager";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus } from "lucide-react";

interface SidebarProps {
    folders: Folder[];
    tags: Tag[];
    selectedFolderId: string | null;
    selectedTagId: string | null;
    onSelectFolder: (id: string | null) => void;
    onSelectTag: (id: string | null) => void;
    onCreateFolder: (name: string, parentId: string | null) => void;
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
    onSelectFolder,
    onSelectTag,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
    onCreateTag,
    onDeleteTag,
}: SidebarProps) {
    return (
        <div className="w-64 border-r bg-muted/10 h-full flex flex-col gap-6 p-4 overflow-y-auto">
            <div className="space-y-2">
                <Button
                    variant={selectedFolderId === null && selectedTagId === null ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                        onSelectFolder(null);
                        onSelectTag(null);
                    }}
                >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    All Clips
                </Button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Folders</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCreateFolder("New Folder", null)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <FolderTree
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={onCreateFolder}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFolder={onRenameFolder}
                />
            </div>

            <TagManager
                tags={tags}
                selectedTagId={selectedTagId}
                onSelectTag={onSelectTag}
                onCreateTag={onCreateTag}
                onDeleteTag={onDeleteTag}
            />
        </div>
    );
}
