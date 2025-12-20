import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChevronsUpDown, Check, Plus, Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SpaceSwitcher() {
    const { spaces, currentSpace, setCurrentSpace, createSpace, renameSpace, deleteSpace, isLoading } = useAuth();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // State for actions
    const [spaceToEdit, setSpaceToEdit] = useState<{ id: string, name: string } | null>(null);
    const [newSpaceName, setNewSpaceName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when dialogs close
    const cleanup = () => {
        setNewSpaceName("");
        setSpaceToEdit(null);
        setIsSubmitting(false);
    };

    const handleCreateSpace = async () => {
        if (!newSpaceName.trim()) return;
        setIsSubmitting(true);
        try {
            await createSpace(newSpaceName.trim());
            setIsCreateOpen(false);
            toast.success("Space created successfully");
            cleanup();
        } catch (error) {
            toast.error("Failed to create space");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRenameSpace = async () => {
        if (!spaceToEdit || !newSpaceName.trim()) return;
        setIsSubmitting(true);
        try {
            await renameSpace(spaceToEdit.id, newSpaceName.trim());
            setIsRenameOpen(false);
            toast.success("Space renamed successfully");
            cleanup();
        } catch (error) {
            toast.error("Failed to rename space");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSpace = async () => {
        if (!spaceToEdit) return;
        setIsSubmitting(true);
        try {
            await deleteSpace(spaceToEdit.id);
            setIsDeleteOpen(false);
            toast.success("Space deleted successfully");
            cleanup();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete space");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openRename = (e: React.MouseEvent, space: any) => {
        e.stopPropagation();
        setSpaceToEdit(space);
        setNewSpaceName(space.name);
        setIsRenameOpen(true);
    };

    const openDelete = (e: React.MouseEvent, space: any) => {
        e.stopPropagation();
        setSpaceToEdit(space);
        setIsDeleteOpen(true);
    };

    if (isLoading) return null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        className="w-[200px] justify-between ml-2"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Folder className="h-4 w-4 shrink-0 opacity-50" />
                            <span className="truncate">
                                {currentSpace?.name || "Select Space"}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px]">
                    <DropdownMenuLabel>My Spaces</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                        {spaces.map((space) => (
                            <div key={space.id} className="flex items-center group relative">
                                <DropdownMenuItem
                                    onSelect={() => setCurrentSpace(space)}
                                    className="gap-2 flex-1 cursor-pointer pr-8"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-4 h-4 mr-2",
                                        currentSpace?.id === space.id ? "opacity-100" : "opacity-0"
                                    )}>
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <span className="truncate flex-1">{space.name}</span>
                                </DropdownMenuItem>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => openRename(e, space)}>
                                            <Pencil className="mr-2 h-3 w-3" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => openDelete(e, space)}
                                            className="text-red-500 hover:text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-3 w-3" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => {
                        setNewSpaceName("");
                        setIsCreateOpen(true);
                    }} className="gap-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Create Space
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Space</DialogTitle>
                        <DialogDescription>
                            Create a new space to organize your videos and ideation projects.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Space Name (e.g. Work, Personal, Gaming)"
                            value={newSpaceName}
                            onChange={(e) => setNewSpaceName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateSpace()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSpace} disabled={isSubmitting || !newSpaceName.trim()}>
                            {isSubmitting ? "Creating..." : "Create Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Space</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="New Space Name"
                            value={newSpaceName}
                            onChange={(e) => setNewSpaceName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameSpace()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameSpace} disabled={isSubmitting || !newSpaceName.trim()}>
                            {isSubmitting ? "Saving..." : "Rename Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Space</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{spaceToEdit?.name}"? This action cannot be undone and will delete all clips and ideations within this space.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSpace}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Deleting..." : "Delete Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
