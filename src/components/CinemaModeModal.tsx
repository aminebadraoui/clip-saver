import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentBuilder } from "@/components/SegmentBuilder";
import type { Clip } from "@/types/clip";
import { Play, Save } from "lucide-react";
import { saveClips } from "@/utils/storage";

interface CinemaModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    clip: Clip | null;
    onUpdateClip: (updatedClip: Clip) => void;
}

export function CinemaModeModal({ isOpen, onClose, clip, onUpdateClip }: CinemaModeModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [notes, setNotes] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        if (isOpen && clip) {
            setNotes(clip.notes || "");
            setIsPlaying(false);
        }
    }, [isOpen, clip]);

    if (!clip) return null;

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            const updatedClip = { ...clip, notes };
            onUpdateClip(updatedClip);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleSaveClips = async (newClips: Clip[]) => {
        // Add metadata from original clip
        const clipsWithMetadata = newClips.map(newClip => ({
            ...newClip,
            sourceVideoId: clip.id,
            originalVideoUrl: clip.originalVideoUrl || `https://www.youtube.com/watch?v=${clip.videoId}`,
        }));

        await saveClips(clipsWithMetadata);
        // Optionally show a toast or notification here
        alert("Clip saved successfully!");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
                <div className="flex items-center justify-between p-4 border-b">
                    <DialogTitle className="text-xl font-semibold truncate flex-1 mr-4">
                        {clip.title}
                    </DialogTitle>

                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Column: Video Player */}
                    <div className="bg-black flex flex-col relative group cursor-pointer" onClick={() => !isPlaying && setIsPlaying(true)}>
                        <div className="flex-1 relative flex items-center justify-center bg-black">
                            {!isPlaying ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={clip.thumbnail}
                                        alt={clip.title}
                                        className="w-full h-full object-contain opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>
                            ) : (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${clip.videoId}?autoplay=1`}
                                    title={clip.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0"
                                />
                            )}
                        </div>


                    </div>

                    {/* Right Column: Notes & Clipping */}
                    <div className="flex flex-col h-full border-l bg-card/50 overflow-y-auto">
                        {/* Notes Section */}
                        <div className="p-6 border-b space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Notes</h3>
                                <Button
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes || notes === clip.notes}
                                >
                                    {isSavingNotes ? "Saving..." : "Save Notes"}
                                    <Save className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes here..."
                                className="min-h-[150px] resize-none bg-background/50"
                            />
                        </div>

                        {/* Clipping Section */}
                        <div className="flex-1 p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Create Clip</h3>
                            <div className="rounded-lg border bg-background/50 p-4">
                                <SegmentBuilder
                                    videoId={clip.videoId}
                                    videoTitle={clip.title}
                                    thumbnail={clip.thumbnail}
                                    onSave={handleSaveClips}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
