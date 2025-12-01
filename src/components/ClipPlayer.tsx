import type { Clip } from "@/types/clip";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatTime } from "@/utils/formatTime";

interface ClipPlayerProps {
    clip: Clip;
}

export function ClipPlayer({ clip }: ClipPlayerProps) {
    const navigate = useNavigate();

    // Construct embed URL
    // https://www.youtube.com/embed/VIDEO_ID?start=START&end=END&autoplay=1&version=3
    const embedUrl = `https://www.youtube.com/embed/${clip.videoId}?start=${clip.start}&end=${clip.end}&autoplay=1&version=3&rel=0`;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h1 className="text-xl font-bold truncate flex-1">{clip.title}</h1>
            </div>

            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg">
                <iframe
                    src={embedUrl}
                    title={clip.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                <span>
                    Segment: {formatTime(clip.start)} - {formatTime(clip.end)}
                </span>
                <span>
                    Duration: {formatTime(clip.end - clip.start)}
                </span>
            </div>
        </div>
    );
}
