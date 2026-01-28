import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import { InspirationSidebar } from "./InspirationSidebar";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config";
import { getHeaders } from "@/utils/storage";
import { toast } from "sonner";

interface ThumbnailBrainstormingProps {
    thumbnails: { id: string; type: 'text' | 'image'; content: string }[];
    onUpdate: (thumbnails: { id: string; type: 'text' | 'image'; content: string }[]) => void;
    // Add conceptData prop
    conceptData?: any;
}

export const ThumbnailBrainstorming = ({ thumbnails, onUpdate, conceptData }: ThumbnailBrainstormingProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newDesc, setNewDesc] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();

    const addThumbnail = (content: string, type: 'text' | 'image') => {
        if (!content.trim()) return;
        onUpdate([...thumbnails, { id: crypto.randomUUID(), type, content }]);
        if (type === 'text') setNewDesc("");
    };

    const removeThumbnail = (id: string) => {
        onUpdate(thumbnails.filter(t => t.id !== id));
    };

    const handleGenerateConcepts = async () => {
        if (!token) return;
        setIsLoading(true);

        try {
            // 1. Start Job
            const res = await fetch(`${API_URL}/api/ideation/generate-thumbnails`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    conceptData: conceptData || {},
                    titles: [] // Optionally pass titles if we had them here
                })
            });

            if (!res.ok) throw new Error("Failed to start generation");

            const { jobId } = await res.json();

            // 2. Poll for results
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`${API_URL}/api/jobs/${jobId}`, {
                        headers: getHeaders()
                    });

                    if (statusRes.ok) {
                        const job = await statusRes.json();

                        if (job.status === 'completed') {
                            clearInterval(pollInterval);
                            setIsLoading(false);

                            // Parse Output
                            let generatedConcepts: any[] = [];
                            try {
                                const outputText = typeof job.output === 'string' ? job.output : JSON.stringify(job.output);

                                // For MVP: Add the whole text as one item, user can split it manually
                                generatedConcepts.push({ id: crypto.randomUUID(), type: 'text', content: outputText });

                            } catch (e) {
                                console.error("Parse error", e);
                            }

                            onUpdate([...thumbnails, ...generatedConcepts]);
                            toast.success("Concepts generated!");
                        } else if (job.status === 'failed') {
                            clearInterval(pollInterval);
                            setIsLoading(false);
                            toast.error("Generation failed");
                        }
                    }
                } catch (e) {
                    clearInterval(pollInterval);
                    setIsLoading(false);
                    console.error("Polling error", e);
                }
            }, 2000); // Poll every 2s

        } catch (e) {
            console.error(e);
            toast.error("Failed to start generation");
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="space-y-1.5">
                    <CardTitle>Thumbnails</CardTitle>
                    <CardDescription>Visual ideas & moodboard.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleGenerateConcepts(); }}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isLoading ? "Leo Ideate" : "AI Ideate"}
                    </Button>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {thumbnails.map(thumb => (
                            <div key={thumb.id} className="relative group border rounded-lg p-2 bg-muted/20">
                                {thumb.type === 'image' ? (
                                    <img src={thumb.content} alt="Thumbnail Idea" className="w-full h-48 object-cover rounded" />
                                ) : (
                                    <div className="min-h-[12rem] flex flex-col p-4 text-sm font-medium whitespace-pre-wrap">
                                        {thumb.content}
                                    </div>
                                )}
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeThumbnail(thumb.id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        {thumbnails.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p>No thumbnails yet.</p>
                                <p className="text-xs mt-1">Add one manually or assume the AI role!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}

            <InspirationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                type="thumbnail"
                onSelect={(content: any) => {
                    if (typeof content === 'string') {
                        addThumbnail(content, 'image');
                    } else if (content.type === 'description') {
                        addThumbnail(content.content, 'text');
                    }
                }}
            />
        </Card>
    );
};
