import { useState } from "react";
import { Image as ImageIcon, Trash2, Edit2, ExternalLink } from "lucide-react";
import type { Image } from "@/utils/imageApi";

interface ImageCardProps {
    image: Image;
    onDelete: (id: string) => void;
    onClick: (image: Image) => void;
}

export function ImageCard({ image, onDelete, onClick }: ImageCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onClick(image)}
        >
            {/* Image */}
            <div className="aspect-square bg-muted relative overflow-hidden">
                {!imageError ? (
                    <img
                        src={image.thumbnail_url || image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                )}

                {/* Hover Overlay */}
                {isHovered && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick(image);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                            title="View details"
                        >
                            <Edit2 className="w-5 h-5 text-white" />
                        </button>
                        {image.source_url && (
                            <a
                                href={image.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                                title="Open source"
                            >
                                <ExternalLink className="w-5 h-5 text-white" />
                            </a>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(image.id);
                            }}
                            className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Title */}
            <div className="p-3">
                <h3 className="text-sm font-medium truncate">{image.title}</h3>
                {image.source_domain && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {image.source_domain}
                    </p>
                )}
            </div>
        </div>
    );
}
