import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { FolderTree } from "./FolderTree";
import { TagManager } from "./TagManager";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus, Video, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SaveAssetForm } from "./SaveAssetForm";

interface SidebarProps {
    folders: Folder[];
    tags: Tag[];
    selectedFolderId: string | null;
    selectedTagId: string | null;
    onSelectFolder: (id: string | null) => void;
    onSelectTag: (id: string | null) => void;
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
    onSelectFolder,
    onSelectTag,
    onCreateFolder,
    onDeleteFolder,
    onRenameFolder,
    onCreateTag,
    onDeleteTag,
}: SidebarProps) {
    const [externalUrl, setExternalUrl] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddExternalClick = (e: React.MouseEvent) => {
        // If URL is empty, maybe don't open? Or open empty?
        // User said "paste the link and when we click Add Link, a modal appears"
        if (!externalUrl.trim()) {
            e.preventDefault(); // Prevent dialog open if empty?
            // Actually, let's allow opening empty if they want to manually type it inside.
            // But if they typed something, we want to pass it.
        }
    };
    const videoFolders = folders.filter(f => f.category === 'video' || !f.category); // Default to video if missing
    const imageFolders = folders.filter(f => f.category === 'image');

    return (
        <div className="w-64 border-r bg-muted/10 h-full flex flex-col gap-6 p-4 overflow-y-auto">
            <div className="space-y-2">
                <div className="flex gap-2">
                    <Input
                        placeholder="Paste link..."
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        className="h-9"
                    />
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddExternalClick}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Save External Asset</DialogTitle>
                            </DialogHeader>
                            <SaveAssetForm
                                initialAssets={[{ videoId: "", title: "", thumbnail: "" }]}
                                initialUrl={externalUrl} // Pass URL here
                                onSave={() => {
                                    setIsAddModalOpen(false);
                                    setExternalUrl("");
                                }}
                                onCancel={() => setIsAddModalOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

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

            {/* Video Folders */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <h3>Video</h3>
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
                <FolderTree
                    folders={videoFolders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={(name, parentId) => onCreateFolder(name, parentId, 'video')}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFolder={onRenameFolder}
                />
            </div>

            {/* Image Folders */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <ImageIcon className="w-4 h-4" />
                        <h3>Image</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCreateFolder("New Image Folder", null, 'image')}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <FolderTree
                    folders={imageFolders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateFolder={(name, parentId) => onCreateFolder(name, parentId, 'image')}
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
