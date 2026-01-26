import { useNavigate } from "react-router-dom";
import type { Clip } from "@/types/clip";
import type { Tag } from "@/types/tag";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClipListRowProps {
    clip: Clip;
    tags: Tag[];
    onDelete: (id: string) => void;
}

export function ClipListRow({ clip, tags, onDelete }: ClipListRowProps) {
    const navigate = useNavigate();
    // folder find removed
    const clipTags = tags.filter(t => clip.tagIds?.includes(t.id));

    return (
        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div
                className={`relative w-32 h-20 flex-shrink-0 cursor-pointer`}
                onClick={() => navigate(`/clip/${clip.id}`)}
            >
                <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                    {clip.type === 'clip' ? 'CLIP' : clip.type === 'short' ? 'SHORT' : 'VIDEO'}
                </div>
                {clip.outlierScore != null && (
                    <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 flex items-center gap-0.5">
                        {Number(clip.outlierScore).toFixed(1)}x
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate" title={clip.title}>{clip.title}</h3>

                {/* Metrics Row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {clip.viewCount !== undefined && (
                        <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>
                                {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(clip.viewCount)}
                            </span>
                        </div>
                    )}
                    {clip.createdAt && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">

                    {clip.viralRatio && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Viral: {clip.viralRatio.toFixed(2)}x
                        </span>
                    )}
                    {clip.timeSinceUploadRatio && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Vel: {clip.timeSinceUploadRatio.toFixed(1)}
                        </span>
                    )}
                </div>
                <div className="flex gap-1 mt-2">
                    {clipTags.map(tag => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-1 py-0 h-5" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                            {tag.name}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => window.open(clip.originalVideoUrl || `https://www.youtube.com/watch?v=${clip.videoId}`, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(clip.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
            </div>
        </div>
    );
}
