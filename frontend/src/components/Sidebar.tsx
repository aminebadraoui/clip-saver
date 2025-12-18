import type { Folder } from "@/types/folder";
import { FolderTree } from "./FolderTree";
import { Button } from "@/components/ui/button";
import { Home, Plus, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
    folders: Folder[];
    selectedFolderId: string | null;
    filterType: 'all' | 'video' | 'clip';
    onSelectFolder: (id: string | null) => void;
    onSelectTag: (id: string | null) => void;
    onSelectFilterType: (type: 'all' | 'video' | 'clip') => void;
    onCreateFolder: (name: string, parentId: string | null, category: 'video' | 'image') => void;
    onDeleteFolder: (id: string) => void;
    onRenameFolder: (id: string, newName: string) => void;
}

export function Sidebar({
    folders,
    selectedFolderId,
    onSelectFolder,
    onSelectTag,
    onSelectFilterType,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
}: SidebarProps) {
    const location = useLocation();
    const videoFolders = folders.filter(f => f.category === 'video' || !f.category);

    const isIdeation = location.pathname.startsWith('/ideation');

    return (
        <div className="w-64 border-r bg-muted/10 h-full flex flex-col gap-6 p-4 overflow-y-auto">
            <div className="space-y-2">
                <Link to="/dashboard">
                    <Button
                        variant={location.pathname.startsWith('/dashboard') ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                            onSelectFilterType('video');
                            onSelectFolder(null);
                            onSelectTag(null);
                        }}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Button>
                </Link>

                <Link to="/ideation">
                    <Button
                        variant={isIdeation ? "secondary" : "ghost"}
                        className="w-full justify-start"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Video Ideation
                    </Button>
                </Link>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-semibold text-muted-foreground">Folders</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCreateFolder("New Video Folder", null, 'video')}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <FolderTree
                    folders={videoFolders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={(name, parentId) => onCreateFolder(name, parentId, 'video')}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFolder={onRenameFolder}
                />
            </div>
        </div>
    );
}
