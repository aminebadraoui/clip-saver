import { useState } from "react";
import type { Folder } from "@/types/folder";
import { ChevronRight, ChevronDown, Folder as FolderIcon, MoreVertical, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FolderTreeProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onDeleteFolder: (id: string) => void;
    onRenameFolder: (id: string, newName: string) => void;
}

interface FolderItemProps extends FolderTreeProps {
    folder: Folder;
    level: number;
}

function FolderItem({ folder, folders, level, selectedFolderId, onSelectFolder, onCreateFolder, onDeleteFolder, onRenameFolder }: FolderItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(folder.name);

    const childFolders = folders.filter(f => f.parentId === folder.id);
    const hasChildren = childFolders.length > 0;

    const handleRename = () => {
        if (editName.trim() && editName !== folder.name) {
            onRenameFolder(folder.id, editName);
        }
        setIsEditing(false);
    };

    return (
        <div>
            <div
                className={cn(
                    "flex items-center group px-2 py-1 rounded-md cursor-pointer hover:bg-accent/50",
                    selectedFolderId === folder.id && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelectFolder(folder.id)}
            >
                <div
                    className="p-1 mr-1 hover:bg-muted rounded-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                    ) : (
                        <div className="w-3 h-3" />
                    )}
                </div>

                <FolderIcon className="w-4 h-4 mr-2 text-muted-foreground" />

                {isEditing ? (
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        className="h-6 text-xs py-0 px-1"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="flex-1 text-sm truncate">{folder.name}</span>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onCreateFolder("New Folder", folder.id)}>
                            <Plus className="w-4 h-4 mr-2" /> New Subfolder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteFolder(folder.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isOpen && (
                <div>
                    {childFolders.map(child => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            folders={folders}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onCreateFolder={onCreateFolder}
                            onDeleteFolder={onDeleteFolder}
                            onRenameFolder={onRenameFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderTree({ folders, selectedFolderId, onSelectFolder, onCreateFolder, onDeleteFolder, onRenameFolder }: FolderTreeProps) {
    const rootFolders = folders.filter(f => !f.parentId);

    return (
        <div className="space-y-1">
            {rootFolders.map(folder => (
                <FolderItem
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    level={0}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={onCreateFolder}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFolder={onRenameFolder}
                />
            ))}
        </div>
    );
}
