import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { InspirationSidebar } from "./InspirationSidebar";

interface TitleBrainstormingProps {
    titles: { id: string; text: string; score?: number }[];
    onUpdate: (titles: { id: string; text: string; score?: number }[]) => void;
}

export const TitleBrainstorming = ({ titles, onUpdate }: TitleBrainstormingProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    const addTitle = (text: string) => {
        if (!text.trim()) return;
        onUpdate([...titles, { id: crypto.randomUUID(), text, score: 0 }]);
        setNewTitle("");
    };

    const removeTitle = (id: string) => {
        onUpdate(titles.filter(t => t.id !== id));
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="space-y-1.5">
                    <CardTitle>Title Ideation</CardTitle>
                    <CardDescription>Brainstorm clickable titles.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Write a title idea..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTitle(newTitle)}
                        />
                        <Button onClick={() => addTitle(newTitle)}>Add</Button>
                    </div>

                    <div className="space-y-2">
                        {titles.map((title, index) => (
                            <div key={title.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded group">
                                <span className="text-muted-foreground w-6 text-center">{index + 1}.</span>
                                <div className="flex-1 font-medium">{title.text}</div>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeTitle(title.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        {titles.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No titles yet.</p>
                        )}
                    </div>
                </CardContent>
            )}

            <InspirationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                type="title"
                onSelect={(title) => addTitle(title)}
            />
        </Card>
    );
};
