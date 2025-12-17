import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { InspirationSidebar } from "./InspirationSidebar";

interface ThumbnailBrainstormingProps {
    thumbnails: { id: string; type: 'text' | 'image'; content: string }[];
    onUpdate: (thumbnails: { id: string; type: 'text' | 'image'; content: string }[]) => void;
}

export const ThumbnailBrainstorming = ({ thumbnails, onUpdate }: ThumbnailBrainstormingProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newDesc, setNewDesc] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    const addThumbnail = (content: string, type: 'text' | 'image') => {
        if (!content.trim()) return;
        onUpdate([...thumbnails, { id: crypto.randomUUID(), type, content }]);
        if (type === 'text') setNewDesc("");
    };

    const removeThumbnail = (id: string) => {
        onUpdate(thumbnails.filter(t => t.id !== id));
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="space-y-1.5">
                    <CardTitle>Thumbnails</CardTitle>
                    <CardDescription>Visual ideas & moodboard.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Inspiration
                    </Button>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Describe a thumbnail idea..."
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addThumbnail(newDesc, 'text')}
                        />
                        <Button onClick={() => addThumbnail(newDesc, 'text')}>Add</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {thumbnails.map(thumb => (
                            <div key={thumb.id} className="relative group border rounded-lg p-2 bg-muted/20">
                                {thumb.type === 'image' ? (
                                    <img src={thumb.content} alt="Thumbnail Idea" className="w-full h-32 object-cover rounded" />
                                ) : (
                                    <div className="h-32 flex items-center justify-center p-4 text-center text-sm font-medium">
                                        {thumb.content}
                                    </div>
                                )}
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeThumbnail(thumb.id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        {thumbnails.length === 0 && (
                            <div className="col-span-2 text-sm text-muted-foreground text-center py-4">No thumbnails yet.</div>
                        )}
                    </div>
                </CardContent>
            )}

            <InspirationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                type="thumbnail"
                onSelect={(url) => addThumbnail(url, 'image')}
            />
        </Card>
    );
};
