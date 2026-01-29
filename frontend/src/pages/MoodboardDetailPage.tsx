import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import type { Image } from "@/utils/imageApi";
import { fetchImages, deleteImage, saveImage } from "@/utils/imageApi";
import { fetchMoodboards, updateMoodboard, getMoodboardSparks, type Moodboard } from "@/utils/moodboardApi";
import type { Spark } from "@/utils/sparksApi";
import { ImageDetailModal } from "@/components/ImageDetailModal";
import { SparkCard } from "@/components/sparks/SparkCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Grid3x3, Loader2, ArrowLeft, Pencil, Check, X, Plus, Link as LinkIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function MoodboardDetailPage() {
    const { moodboardId } = useParams<{ moodboardId: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { tags } = useAppData();
    const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // Add Image State
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [isSavingImage, setIsSavingImage] = useState(false);

    useEffect(() => {
        loadMoodboardAndImages();
    }, [token, moodboardId]);

    const loadMoodboardAndImages = async () => {
        if (!token || !moodboardId) return;

        setIsLoading(true);
        try {
            // Load moodboard details
            const moodboards = await fetchMoodboards(token);
            const foundMoodboard = moodboards.find(m => m.id === moodboardId);

            if (!foundMoodboard) {
                toast.error("Moodboard not found");
                navigate("/moodboards");
                return;
            }

            setMoodboard(foundMoodboard);

            // Load images
            const filters = { moodboard_id: moodboardId, limit: 100 };
            const imagesData = await fetchImages(token, foundMoodboard.space_id, filters);
            setImages(imagesData);

            // Load sparks
            const sparksData = await getMoodboardSparks(token, moodboardId);
            setSparks(sparksData);

        } catch (error: any) {
            toast.error(error.message || "Failed to load moodboard");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!token) return;
        if (!confirm("Are you sure you want to delete this image?")) return;

        try {
            await deleteImage(token, imageId);
            setImages((prev) => prev.filter((img) => img.id !== imageId));
            toast.success("Image deleted successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete image");
        }
    };

    const handleImageUpdate = (updatedImage: Image) => {
        setImages((prev) =>
            prev.map((img) => (img.id === updatedImage.id ? updatedImage : img))
        );
    };

    const handleSaveMoodboard = async () => {
        if (!token || !moodboard) return;

        try {
            const updated = await updateMoodboard(token, moodboard.id, {
                name: editName,
                description: editDescription,
            });
            setMoodboard(updated);
            setIsEditing(false);
            toast.success("Moodboard updated successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to update moodboard");
        }
    };

    const handleAddImage = async () => {
        if (!newImageUrl || !moodboard || !token) return;

        try {
            // Basic URL validation
            new URL(newImageUrl);
        } catch (e) {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsSavingImage(true);
        try {
            const newImage = await saveImage(token, {
                title: "New Image",
                image_url: newImageUrl,
                source_url: newImageUrl,
                moodboard_id: moodboard.id
            }, moodboard.space_id);

            setImages(prev => [newImage, ...prev]);
            setNewImageUrl("");
            setIsAddingImage(false);
            toast.success("Image added successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to add image");
        } finally {
            setIsSavingImage(false);
        }
    };

    const startEditing = () => {
        if (!moodboard) return;
        setEditName(moodboard.name);
        setEditDescription(moodboard.description || "");
        setIsEditing(true);
    };

    // Combine and Sort Items by Date
    const combinedItems = [
        ...images.map(img => ({ ...img, type: 'image' as const, sortTime: img.createdAt })),
        ...sparks.map(spark => ({ ...spark, type: 'spark' as const, sortTime: spark.createdAt }))
    ].sort((a, b) => b.sortTime - a.sortTime);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4"
                    onClick={() => navigate("/moodboards")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Moodboards
                </Button>

                {isEditing ? (
                    <div className="space-y-4 max-w-xl">
                        <div className="space-y-2">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Moodboard Name"
                                className="text-xl font-bold"
                            />
                            <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Description (optional)"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveMoodboard} size="sm">
                                <Check className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                            <Button variant="ghost" onClick={() => setIsEditing(false)} size="sm">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="group relative">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold">{moodboard?.name || "Moodboard"}</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={startEditing}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                        </div>
                        {moodboard?.description && (
                            <p className="text-muted-foreground">
                                {moodboard.description}
                            </p>
                        )}
                    </div>
                )}

                {/* Add Image Section */}
                <div className="mt-6 mb-2">
                    {!isAddingImage ? (
                        <Button
                            variant="outline"
                            className="w-full border-dashed py-8 hover:bg-muted/50"
                            onClick={() => setIsAddingImage(true)}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Image from URL
                        </Button>
                    ) : (
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                            <h3 className="text-sm font-medium mb-3 flex items-center">
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Add Image URL
                            </h3>
                            <div className="flex gap-2">
                                <Input
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="flex-1 bg-background"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddImage();
                                        if (e.key === 'Escape') setIsAddingImage(false);
                                    }}
                                />
                                <Button onClick={handleAddImage} disabled={isSavingImage || !newImageUrl}>
                                    {isSavingImage ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsAddingImage(false);
                                        setNewImageUrl("");
                                    }}
                                    disabled={isSavingImage}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Images/Sparks Masonry Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : combinedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Grid3x3 className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Empty Moodboard</h3>
                    <p className="text-muted-foreground max-w-md">
                        Add images or sparks to start building your universe.
                    </p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
                    {combinedItems.map((item) => {
                        if (item.type === 'image') {
                            const image = item as Image;
                            return (
                                <div
                                    key={`img-${image.id}`}
                                    className="break-inside-avoid mb-4 group relative cursor-pointer"
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <div className="relative rounded-lg overflow-hidden bg-muted">
                                        <img
                                            src={image.thumbnail_url || image.image_url}
                                            alt={image.title}
                                            className="w-full h-auto transition-transform group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(image.id);
                                                    }}
                                                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5 text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        } else if (item.type === 'spark') {
                            return <SparkCard key={`spark-${item.id}`} spark={item as Spark} />;
                        }
                        return null;
                    })}
                </div>
            )}

            {/* Image Detail Modal */}
            {selectedImage && (
                <ImageDetailModal
                    image={selectedImage}
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    onUpdate={handleImageUpdate}
                    availableTags={tags}
                />
            )}
        </div>
    );
}
