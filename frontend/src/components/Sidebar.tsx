import { Button } from "@/components/ui/button";
import { Folder, Layers, Wand2 } from "lucide-react"; // Import appropriate icons
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { updateClip } from "@/utils/storage";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import React from "react";

interface SidebarProps {
    onSelectTag: (id: string | null) => void;
    onSelectFilterType: (type: 'all' | 'video' | 'clip') => void;
}

export function Sidebar({
    onSelectTag,
    onSelectFilterType,
}: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { spaces, currentSpace, setCurrentSpace } = useAuth(); // Assuming createSpace is available or we add a button
    const { clips, refreshData } = useAppData();
    const [dragOverSpaceId, setDragOverSpaceId] = React.useState<string | null>(null);

    const handleSpaceClick = (space: any | null) => { // space null means 'all'
        // If clicking 'all', we set currentSpace to null or a special 'all' object?
        // AuthContext usually handles 'all' string ID for localStorage, but setCurrentSpace expects object or null?
        // AuthContext: setCurrentSpace(space: Space | null).
        // If null, it clears localStorage.
        // Wait, AuthContext logic: "if (space) setItem... else removeItem".
        // And "refreshSpaces" loads 'all' from LOCAL_STORAGE_ID='all' -> setCurrentSpace(ALL_SPACES).
        // ALL_SPACES has id='all'.

        // Actually, let's look at AuthContext again.
        // export const ALL_SPACES = { id: 'all', ... }
        // So we should pass ALL_SPACES or null?
        // We will import ALL_SPACES from AuthContext if exported, or just use `spaces.find`...
        // Actually `useAuth` hook returns `spaces` (array of Space). Does it include ALL_SPACES?
        // `refreshSpaces`: `const spacesData = await response.json(); setSpaces(spacesData)`.
        // So `spaces` is just DB spaces.
        // `currentSpace` can be `ALL_SPACES`.

        // I'll make "All Videos" button set to `ALL_SPACES` (if I can import it) or just handle it via a helper if I modify AuthContext, 
        // OR just rely on logic:

        // For now, I will assume I can just use a "Home" button that calls `setCurrentSpace({ id: 'all', name: 'All Spaces', createdAt: 0 })`.
        // Better: import ALL_SPACES from AuthContext? It's exported.

        // Simpler: Just rely on "Navigating to /dashboard" usually reloading? No, it's SPA.
        // I'll import `ALL_SPACES` if possible, otherwise define it locally matching AuthContext.
        const ALL_SPACES = { id: 'all', name: 'All Spaces', createdAt: 0 };

        if (space === null) {
            setCurrentSpace(ALL_SPACES);
        } else {
            setCurrentSpace(space);
        }

        onSelectTag(null);
        onSelectFilterType('video');

        // Navigate to dashboard if not there
        if (location.pathname !== '/dashboard') {
            navigate('/dashboard');
        }
    };

    const handleDragOver = (e: React.DragEvent, spaceId: string | null) => {
        e.preventDefault();
        setDragOverSpaceId(spaceId || 'all');
    };

    const handleDragLeave = () => {
        setDragOverSpaceId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetSpaceId: string) => {
        e.preventDefault();
        // Clear highlight immediately on drop
        setDragOverSpaceId(null);

        const clipId = e.dataTransfer.getData("clipId");
        if (!clipId) return;

        const clip = clips.find(c => c.id === clipId);
        if (!clip) return;

        if (clip.spaceId === targetSpaceId) return;

        try {
            await updateClip({ ...clip, spaceId: targetSpaceId });
            toast.success("Moved to " + (spaces.find(s => s.id === targetSpaceId)?.name || "space"));
            await refreshData();
        } catch (err) {
            toast.error("Failed to move clip");
        }
    };

    return (
        <div className="w-64 border-r bg-muted/10 h-full flex flex-col gap-6 p-4 overflow-y-auto">
            <div className="space-y-2">
                {/* All Videos / Home */}
                <Link to="/dashboard">
                    <Button
                        variant={currentSpace?.id === 'all' ? "secondary" : "ghost"}
                        className="w-full justify-start font-medium"
                        onClick={() => handleSpaceClick(null)}
                        onDragOver={(e) => e.preventDefault()}
                    // onDrop={(e) => handleDrop(e, 'all')} // Disable dropping on "All" for now unless backend supports removing space
                    >
                        <Layers className="w-4 h-4 mr-2" />
                        All Videos
                    </Button>
                </Link>

                <Separator className="my-2 bg-border/50" />

                <div className="px-2 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                    Spaces
                </div>

                {spaces.map(space => (
                    <Button
                        key={space.id}
                        variant={currentSpace?.id === space.id ? "secondary" : "ghost"}
                        className={`w-full justify-start ${currentSpace?.id === space.id ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground'} ${dragOverSpaceId === space.id ? 'bg-primary/20 ring-2 ring-primary/50 text-foreground' : ''}`}
                        onClick={() => handleSpaceClick(space)}
                        onDragOver={(e) => handleDragOver(e, space.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, space.id)}
                    >
                        <Folder className={`w-4 h-4 mr-2 ${currentSpace?.id === space.id ? 'fill-current' : ''}`} />
                        <span className="truncate">{space.name}</span>
                    </Button>
                ))}

                {/* Add standard "AI Workflows" link at bottom */}
                <Separator className="my-2 bg-border/50" />

                <Link to="/workflows">
                    <Button
                        variant={location.pathname.startsWith('/workflows') ? "secondary" : "ghost"}
                        className="w-full justify-start"
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        AI Workflows
                    </Button>
                </Link>

            </div>
        </div>
    );
}
