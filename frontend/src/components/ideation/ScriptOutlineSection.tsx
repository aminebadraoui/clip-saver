import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { InspirationSidebar } from "./InspirationSidebar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ScriptOutlineSectionProps {
    outline: string;
    onUpdate: (outline: string) => void;
}

export const ScriptOutlineSection = ({ outline, onUpdate }: ScriptOutlineSectionProps) => {
    const { token } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleGenerate = async (clip: any) => {
        setIsSidebarOpen(false);
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/clips/${clip.id}/outline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                onUpdate(outline ? outline + "\n\n" + data.outline : data.outline);
                toast.success("Outline generated from clip!");
            }
        } catch (e) {
            toast.error("Failed to generate outline");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="space-y-1.5">
                    <CardTitle>Script Outline</CardTitle>
                    <CardDescription>Structure your video segments.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGenerating ? "Generating..." : "Generate form Clip"}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <Textarea
                        value={outline}
                        onChange={(e) => onUpdate(e.target.value)}
                        placeholder="I. Intro..."
                        className="min-h-[300px] font-mono"
                    />
                </CardContent>
            )}

            <InspirationSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                type="outline"
                onSelect={(clip) => handleGenerate(clip)}
            />
        </Card>
    );
};
