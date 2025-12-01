import type { Clip } from "@/types/clip";
import { formatTime } from "@/utils/formatTime";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ClipCardProps {
    clip: Clip;
    onDelete: (id: string) => void;
}

export function ClipCard({ clip, onDelete }: ClipCardProps) {
    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-muted">
                <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="object-cover w-full h-full"
                    loading="lazy"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatTime(clip.start)} - {formatTime(clip.end)}
                </div>
            </div>
            <CardContent className="p-4 flex-1">
                <h3 className="font-semibold line-clamp-2 text-sm sm:text-base" title={clip.title}>
                    {clip.title}
                </h3>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button asChild variant="default" size="sm" className="flex-1">
                    <Link to={`/clip/${clip.id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                    </Link>
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onDelete(clip.id)}
                    title="Delete Clip"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
