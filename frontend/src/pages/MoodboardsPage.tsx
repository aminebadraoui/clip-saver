import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchMoodboards, createMoodboard, deleteMoodboard, type Moodboard } from "@/utils/moodboardApi";
import { fetchImages } from "@/utils/imageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function MoodboardsPage() {
    const { token, currentSpace } = useAuth();
    const navigate = useNavigate();
    const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [imageCounts, setImageCounts] = useState<Record<string, number>>({});

    // Form state
    const [newMoodboardName, setNewMoodboardName] = useState("");
    const [newMoodboardDescription, setNewMoodboardDescription] = useState("");

    useEffect(() => {
        loadMoodboards();
    }, [token, currentSpace?.id]);

    const loadMoodboards = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const spaceId = currentSpace?.id !== 'all' ? currentSpace?.id : undefined;
            const data = await fetchMoodboards(token, spaceId);
            setMoodboards(data);

            // Load image counts for each moodboard
            const counts: Record<string, number> = {};
            for (const moodboard of data) {
                try {
                    const images = await fetchImages(token, moodboard.space_id, { moodboard_id: moodboard.id });
                    counts[moodboard.id] = images.length;
                } catch (error) {
                    counts[moodboard.id] = 0;
                }
            }
            setImageCounts(counts);
        } catch (error: any) {
            toast.error(error.message || "Failed to load moodboards");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMoodboard = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !currentSpace || currentSpace.id === 'all') {
            toast.error("Please select a space first");
            return;
        }

        if (!newMoodboardName.trim()) {
            toast.error("Please enter a moodboard name");
            return;
        }

        setIsCreating(true);
        try {
            await createMoodboard(token, {
                name: newMoodboardName,
                description: newMoodboardDescription || undefined,
                space_id: currentSpace.id,
            });

            toast.success("Moodboard created successfully");
            setNewMoodboardName("");
            setNewMoodboardDescription("");
            setIsDialogOpen(false);
            loadMoodboards();
        } catch (error: any) {
            toast.error(error.message || "Failed to create moodboard");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteMoodboard = async (id: string, name: string) => {
        if (!token) return;
        if (!confirm(`Are you sure you want to delete "${name}"? Images will not be deleted.`)) return;

        try {
            await deleteMoodboard(token, id);
            toast.success("Moodboard deleted successfully");
            loadMoodboards();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete moodboard");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Moodboards</h1>
                    <p className="text-muted-foreground">
                        Organize your saved images into collections
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={currentSpace?.id === 'all'}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Moodboard
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Moodboard</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateMoodboard} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Name</label>
                                <Input
                                    placeholder="e.g., UI Inspiration, Color Palettes"
                                    value={newMoodboardName}
                                    onChange={(e) => setNewMoodboardName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                                <Textarea
                                    placeholder="What's this moodboard for?"
                                    value={newMoodboardDescription}
                                    onChange={(e) => setNewMoodboardDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {currentSpace?.id === 'all' && (
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                        💡 Select a specific space from the sidebar to create moodboards
                    </p>
                </div>
            )}

            {/* Moodboards Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : moodboards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No moodboards yet</h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                        Create your first moodboard to start organizing your saved images
                    </p>
                    {currentSpace?.id !== 'all' && (
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Moodboard
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {moodboards.map((moodboard) => (
                        <Card
                            key={moodboard.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => navigate(`/moodboards/${moodboard.id}`)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{moodboard.name}</CardTitle>
                                        {moodboard.description && (
                                            <CardDescription className="mt-1">
                                                {moodboard.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMoodboard(moodboard.id, moodboard.name);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                        {imageCounts[moodboard.id] ?? 0} {imageCounts[moodboard.id] === 1 ? 'image' : 'images'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
