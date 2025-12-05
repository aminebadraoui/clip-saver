import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { formatTime } from "@/utils/formatTime";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, MoreVertical, FolderInput, Tag as TagIcon, Eye, Clock, Film } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ClipCardProps {
    clip: Clip;
    originalVideo?: Clip | null;
    folders?: Folder[];
    tags?: Tag[];
    onDelete: (id: string) => void;
    onUpdate?: (clip: Clip) => void;
    onCinemaMode?: (clip: Clip) => void;
}

export function ClipCard({ clip, originalVideo, folders = [], tags = [], onDelete, onUpdate, onCinemaMode }: ClipCardProps) {
    const handleMoveToFolder = (folderId: string | null) => {
        if (onUpdate) {
            onUpdate({ ...clip, folderId });
        }
    };

    const handleToggleTag = (tagId: string) => {
        if (onUpdate) {
            const currentTags = clip.tagIds || [];
            const newTags = currentTags.includes(tagId)
                ? currentTags.filter(id => id !== tagId)
                : [...currentTags, tagId];
            onUpdate({ ...clip, tagIds: newTags });
        }
    };

    const clipTags = tags.filter(tag => clip.tagIds?.includes(tag.id));

    // Determine what title and metrics to show
    // Main title is always the clip's title
    const displayTitle = clip.title;
    const originalTitle = originalVideo?.title || clip.originalTitle;

    const displayViewCount = originalVideo?.viewCount ?? clip.viewCount;
    const displayViralRatio = originalVideo?.viralRatio ?? clip.viralRatio;
    const displayEngagementScore = originalVideo?.engagementScore ?? clip.engagementScore;

    return (
        <Card className="group overflow-hidden flex flex-col h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div
                className="relative aspect-video overflow-hidden cursor-pointer"
                onClick={() => onCinemaMode?.(clip)}
            >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
                <img
                    src={clip.thumbnail}
                    alt={displayTitle}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                />

                {/* Duration Badge */}
                {clip.type === 'clip' && typeof clip.start === 'number' && typeof clip.end === 'number' && (
                    <div className="absolute bottom-2 right-2 z-20">
                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-none text-[10px] px-1.5 h-5 font-medium">
                            {formatTime(clip.start)} - {formatTime(clip.end)}
                        </Badge>
                    </div>
                )}

                {/* Engagement Score Badge */}
                {displayEngagementScore != null && (
                    <div className="absolute top-2 left-2 z-20">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md border border-white/10 shadow-lg">
                            <span className="text-xs font-medium text-purple-400">Score</span>
                            <span className="text-sm font-bold">{Number(displayEngagementScore).toFixed(1)}</span>
                        </div>
                    </div>
                )}

                {/* Overlay actions */}
                <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white border border-white/10">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <FolderInput className="w-4 h-4 mr-2" />
                                    Move to Folder
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48 max-h-64 overflow-y-auto">
                                    <DropdownMenuItem onClick={() => handleMoveToFolder(null)}>
                                        <span className={!clip.folderId ? "font-bold" : ""}>Root (None)</span>
                                    </DropdownMenuItem>
                                    {folders.map(folder => (
                                        <DropdownMenuItem key={folder.id} onClick={() => handleMoveToFolder(folder.id)}>
                                            <span className={clip.folderId === folder.id ? "font-bold" : ""}>{folder.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <TagIcon className="w-4 h-4 mr-2" />
                                    Manage Tags
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48">
                                    {tags.length === 0 && <div className="p-2 text-xs text-muted-foreground">No tags created</div>}
                                    {tags.map(tag => (
                                        <DropdownMenuCheckboxItem
                                            key={tag.id}
                                            checked={clip.tagIds?.includes(tag.id)}
                                            onCheckedChange={() => handleToggleTag(tag.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                {tag.name}
                                            </div>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(clip.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Clip
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CardContent className="p-4 flex-1 flex flex-col gap-3">
                <div className="space-y-1">
                    <h3 className="font-semibold line-clamp-2 text-sm sm:text-base leading-snug group-hover:text-primary transition-colors" title={displayTitle}>
                        {displayTitle}
                    </h3>

                    {/* Metrics Row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {displayViewCount !== undefined && (
                            <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>
                                    {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(displayViewCount)}
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
                </div>

                {/* Viral Ratio Pill */}
                {displayViralRatio != null && (
                    <div className="flex">
                        <div className={`
                            inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-white/10
                            ${displayViralRatio >= 1.0 ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-500 border-pink-500/20" :
                                displayViralRatio >= 0.5 ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-purple-500 border-purple-500/20" :
                                    displayViralRatio >= 0.1 ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-500 border-blue-500/20" :
                                        "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            }
                        `}>
                            Viral Ratio: {Number(displayViralRatio).toFixed(2)}x
                        </div>
                    </div>
                )}

                {/* Original Video Info for Clips (Subtitle) */}
                {clip.type === 'clip' && originalTitle && (
                    <div className="pt-2 mt-auto border-t border-border/50">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground line-clamp-1 flex-1" title={`From: ${originalTitle}`}>
                                <span className="opacity-70">From:</span> {originalTitle}
                            </p>
                        </div>
                    </div>
                )}

                {clipTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {clipTags.map(tag => (
                            <Badge
                                key={tag.id}
                                variant="outline"
                                className="text-[10px] px-2 py-0 h-5 font-normal border-0"
                                style={{
                                    backgroundColor: `${tag.color}15`,
                                    color: tag.color,
                                    boxShadow: `0 0 0 1px ${tag.color}30 inset`
                                }}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-primary/90 hover:bg-primary shadow-sm hover:shadow transition-all"
                    onClick={() => onCinemaMode?.(clip)}
                >
                    {clip.type === 'video' ? (
                        <>
                            <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                            Details
                        </>
                    ) : (
                        <>
                            <Film className="w-3.5 h-3.5 mr-2" />
                            See Details
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
