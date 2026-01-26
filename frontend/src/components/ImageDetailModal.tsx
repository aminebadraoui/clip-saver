import { useState, useEffect } from "react";
import { X, ExternalLink, Save } from "lucide-react";
import type { Image } from "@/utils/imageApi";
import { updateImage } from "@/utils/imageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ImageDetailModalProps {
    image: Image;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedImage: Image) => void;
    availableTags: any[];
}

export function ImageDetailModal({
    image,
    isOpen,
    onClose,
    onUpdate,
}: ImageDetailModalProps) {
    const { token } = useAuth();
    const [title, setTitle] = useState(image.title);
    const [notes, setNotes] = useState(image.notes || "");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTitle(image.title);
        setNotes(image.notes || "");
    }, [image]);

    const handleSave = async () => {
        if (!token) return;

        setIsSaving(true);
        try {
            const updated = await updateImage(token, image.id, {
                title,
                notes,
            });
            onUpdate(updated);
            toast.success("Image updated successfully");
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to update image");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Image Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Image Preview */}
                        <div className="space-y-4">
                            <div className="bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={image.image_url}
                                    alt={image.title}
                                    className="w-full h-auto"
                                />
                            </div>
                            {image.source_url && (
                                <a
                                    href={image.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Source
                                </a>
                            )}
                            {image.source_domain && (
                                <p className="text-sm text-muted-foreground">
                                    From: {image.source_domain}
                                </p>
                            )}
                            {image.width && image.height && (
                                <p className="text-sm text-muted-foreground">
                                    Dimensions: {image.width} × {image.height}
                                </p>
                            )}
                        </div>

                        {/* Edit Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Title</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Image title"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Notes</label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about this image..."
                                    rows={4}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
