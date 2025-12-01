import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClips, deleteClip } from "@/utils/storage";
import type { Clip } from "@/types/clip";
import { ClipCard } from "@/components/ClipCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ClipsPage() {
    const [clips, setClips] = useState<Clip[]>([]);

    useEffect(() => {
        setClips(getClips());
    }, []);

    const handleDelete = (id: string) => {
        deleteClip(id);
        setClips(getClips()); // Refresh list
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Your Clips</h1>
                <Button asChild size="lg">
                    <Link to="/create">
                        <Plus className="w-5 h-5 mr-2" /> Create New Clip
                    </Link>
                </Button>
            </div>

            {clips.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                    <h3 className="text-xl font-medium text-muted-foreground mb-4">No clips yet</h3>
                    <p className="text-muted-foreground mb-8">Paste a YouTube link to start creating segments.</p>
                    <Button asChild>
                        <Link to="/create">Get Started</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clips.map((clip) => (
                        <ClipCard key={clip.id} clip={clip} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
