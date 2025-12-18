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
import { ChevronsUpDown, Check, Plus, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SpaceSwitcher() {
    const { spaces, currentSpace, setCurrentSpace, createSpace, isLoading } = useAuth();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSpace = async () => {
        if (!newSpaceName.trim()) return;
        setIsCreating(true);
        try {
            await createSpace(newSpaceName.trim());
            setIsCreateOpen(false);
            setNewSpaceName("");
            toast.success("Space created successfully");
        } catch (error) {
            toast.error("Failed to create space");
        } finally {
            setIsCreating(false);
        }
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
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>My Spaces</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {spaces.map((space) => (
                            <DropdownMenuItem
                                key={space.id}
                                onSelect={() => setCurrentSpace(space)}
                                className="gap-2"
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-4 h-4 mr-2",
                                    currentSpace?.id === space.id ? "opacity-100" : "opacity-0"
                                )}>
                                    <Check className="h-4 w-4" />
                                </div>
                                <span className="truncate">{space.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsCreateOpen(true)} className="gap-2 cursor-pointer">
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
                        <Button onClick={handleCreateSpace} disabled={isCreating || !newSpaceName.trim()}>
                            {isCreating ? "Creating..." : "Create Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
