import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClipListRowProps {
    clip: Clip;
    folders: Folder[];
    tags: Tag[];
    onDelete: (id: string) => void;
    onCinemaMode?: (clip: Clip) => void;
}

export function ClipListRow({ clip, folders, tags, onDelete, onCinemaMode }: ClipListRowProps) {
    const folder = folders.find(f => f.id === clip.folderId);
    const clipTags = tags.filter(t => clip.tagIds?.includes(t.id));

    return (
        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div
                className={`relative w-32 h-20 flex-shrink-0 ${clip.type === 'video' ? 'cursor-pointer' : ''}`}
                onClick={() => clip.type === 'video' && onCinemaMode?.(clip)}
            >
                <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                    {clip.type === 'clip' ? 'CLIP' : 'VIDEO'}
                </div>
                {clip.engagementScore !== undefined && (
                    <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                        {clip.engagementScore.toFixed(1)}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate" title={clip.title}>{clip.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    {folder && (
                        <span className="flex items-center gap-1">
                            📁 {folder.name}
                        </span>
                    )}
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
