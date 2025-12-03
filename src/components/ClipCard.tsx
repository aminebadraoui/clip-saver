import type { Clip } from "@/types/clip";
import type { Folder } from "@/types/folder";
import type { Tag } from "@/types/tag";
import { formatTime } from "@/utils/formatTime";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, MoreVertical, FolderInput, Tag as TagIcon, Scissors } from "lucide-react";
import { Link } from "react-router-dom";
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
    folders?: Folder[];
    tags?: Tag[];
    onDelete: (id: string) => void;
    onUpdate?: (clip: Clip) => void;
}

export function ClipCard({ clip, folders = [], tags = [], onDelete, onUpdate }: ClipCardProps) {
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

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group">
            <div className="relative aspect-video bg-muted">
                <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="object-cover w-full h-full"
                    loading="lazy"
                />
                {clip.type === 'clip' && typeof clip.start === 'number' && typeof clip.end === 'number' && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatTime(clip.start)} - {formatTime(clip.end)}
                    </div>
                )}

                {/* Overlay actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-none">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
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
                                onClick={() => onDelete(clip.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Clip
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CardContent className="p-4 flex-1 space-y-2">
                <h3 className="font-semibold line-clamp-2 text-sm sm:text-base" title={clip.title}>
                    {clip.title}
                </h3>

                {clipTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {clipTags.map(tag => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-[10px] px-1.5 h-5 font-normal"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 gap-2">
                <Button asChild variant="default" size="sm" className="flex-1">
                    <Link to={`/clip/${clip.id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        {clip.type === 'video' ? 'Watch' : 'Play'}
                    </Link>
                </Button>
                {clip.type === 'video' && (
                    <Button asChild variant="secondary" size="sm" className="flex-1">
                        <Link to={`/create?source=${clip.id}`}>
                            <Scissors className="w-4 h-4 mr-2" />
                            Clip
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
