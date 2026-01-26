import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import type { Image } from "@/utils/imageApi";
import { fetchImages, deleteImage } from "@/utils/imageApi";
import { ImageCard } from "@/components/ImageCard";
import { ImageDetailModal } from "@/components/ImageDetailModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3x3, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MoodboardPage() {
    const { token, currentSpace } = useAuth();
    const { tags } = useAppData();
    const [images, setImages] = useState<Image[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);

    useEffect(() => {
        loadImages();
    }, [token, currentSpace?.id, selectedTagIds]);

    const loadImages = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const filters = {
                search: searchQuery || undefined,
                tag_ids: selectedTagIds.length > 0 ? selectedTagIds.join(",") : undefined,
                limit: 100,
            };

            const data = await fetchImages(token, currentSpace?.id !== 'all' ? currentSpace?.id : undefined, filters);
            setImages(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to load images");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        loadImages();
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

    const toggleTagFilter = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId]
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Moodboard</h1>
                <p className="text-muted-foreground">
                    Your collection of saved images from across the web
                </p>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search images by title, notes, or source..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={handleSearch}>Search</Button>
                </div>

                {/* Tag Filters */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground self-center">
                            Filter by tags:
                        </span>
                        {tags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => toggleTagFilter(tag.id)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTagIds.includes(tag.id)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80"
                                    }`}
                            >
                                {tag.name}
                            </button>
                        ))}
                        {selectedTagIds.length > 0 && (
                            <button
                                onClick={() => setSelectedTagIds([])}
                                className="text-sm text-muted-foreground hover:text-foreground underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Images Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Grid3x3 className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No images yet</h3>
                    <p className="text-muted-foreground max-w-md">
                        Start building your moodboard by right-clicking on any image across
                        the web and selecting "Save to ClipCoba Moodboard"
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {images.map((image) => (
                        <ImageCard
                            key={image.id}
                            image={image}
                            onDelete={handleDelete}
                            onClick={setSelectedImage}
                        />
                    ))}
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
