import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Trash2, ChevronDown, ChevronUp, Loader2, Wand2 } from "lucide-react";
import { InspirationSidebar } from "./InspirationSidebar";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config";


interface TitleBrainstormingProps {
    titles: { id: string; text: string; score?: number; type?: 'inspiration' | 'generated' | 'manual' }[];
    onUpdate: (titles: { id: string; text: string; score?: number; type?: 'inspiration' | 'generated' | 'manual' }[]) => void;
    conceptData?: any;
}

export const TitleBrainstorming = ({ titles, onUpdate, conceptData }: TitleBrainstormingProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    const [isGenerating, setIsGenerating] = useState(false);
    const { token } = useAuth(); // Need auth context



    const handleGenerate = async () => {
        // Collect inspiration titles
        const inspirationTitles = titles.filter(t => t.type === 'inspiration');
        // If user hasn't added any titles yet, we can't really "use inspiration", 
        // but maybe they want general ideas? 
        // The prompt says "if the user selects titles from inspiration...".
        // But let's pass whatever is there + the concept.

        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/generate-titles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...conceptData,
                    inspirationTitles
                })
            });
            if (res.ok) {
                const data = await res.json();
                // Append new titles with type 'generated'
                const newTitles = data.titles.map((t: any) => ({ ...t, type: 'generated' }));
                onUpdate([...titles, ...newTitles]);
            } else {
                console.error("Failed to generate titles");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const addTitle = (text: string, type: 'manual' | 'inspiration' = 'manual') => {
        if (!text.trim()) return;
        onUpdate([...titles, { id: crypto.randomUUID(), text, score: 0, type }]);
        setNewTitle("");
    };

    const removeTitle = (id: string) => {
        onUpdate(titles.filter(t => t.id !== id));
    };


    const inspirationTitles = titles.filter(t => t.type === 'inspiration');
    const userTitles = titles.filter(t => t.type !== 'inspiration');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="space-y-1.5">
                    <CardTitle>Title Ideation</CardTitle>
                    <CardDescription>Brainstorm clickable titles.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {inspirationTitles.length > 0 && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                            Generate Ideas
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Inspiration
                    </Button>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="space-y-6">
                    {/* Inspiration Section */}
                    {inspirationTitles.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Lightbulb className="w-4 h-4" />
                                <span>Inspiration</span>
                            </div>
                            <div className="grid gap-2">
                                {inspirationTitles.map((title) => (
                                    <div key={title.id} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded group">
                                        <div className="flex-1 font-medium text-sm">{title.text}</div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeTitle(title.id)}>
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Titles Section */}
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Write a title idea..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTitle(newTitle, 'manual')}
                            />
                            <Button onClick={() => addTitle(newTitle, 'manual')}>Add</Button>
                        </div>

                        <div className="space-y-2">
                            {userTitles.map((title, index) => (
                                <div key={title.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded group">
                                    <span className="text-muted-foreground w-6 text-center">{index + 1}.</span>
                                    <div className="flex-1 font-medium">{title.text}</div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeTitle(title.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            {userTitles.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No generated or manual titles yet.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}

            <InspirationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                type="title"
                onSelect={(title) => addTitle(title, 'inspiration')}
            />
        </Card>
    );
};
