import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import type { Image } from "@/utils/imageApi";
import { fetchImages, deleteImage } from "@/utils/imageApi";
import { fetchMoodboards, type Moodboard } from "@/utils/moodboardApi";
import { ImageDetailModal } from "@/components/ImageDetailModal";
import { Button } from "@/components/ui/button";
import { Grid3x3, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function MoodboardDetailPage() {
    const { moodboardId } = useParams<{ moodboardId: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { tags } = useAppData();
    const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);

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

            // Load images for this moodboard
            const filters = {
                moodboard_id: moodboardId,
                limit: 100,
            };

            const data = await fetchImages(token, foundMoodboard.space_id, filters);
            setImages(data);
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
                <h1 className="text-3xl font-bold mb-2">{moodboard?.name || "Moodboard"}</h1>
                {moodboard?.description && (
                    <p className="text-muted-foreground">
                        {moodboard.description}
                    </p>
                )}
            </div>

            {/* Images Masonry Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Grid3x3 className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No images yet</h3>
                    <p className="text-muted-foreground max-w-md">
                        Start building your moodboard by saving images from across the web using the ClipCoba extension
                    </p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
                    {images.map((image) => (
                        <div
                            key={image.id}
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
                                        {image.source_url && (
                                            <a
                                                href={image.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                                                title="Open source"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(image.id);
                                            }}
                                            className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
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
