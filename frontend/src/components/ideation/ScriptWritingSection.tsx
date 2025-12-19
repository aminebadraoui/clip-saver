
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Loader2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { API_URL } from "@/config";


interface ScriptWritingSectionProps {
    content: string;
    onUpdate: (content: string) => void;
    conceptData?: any;
    outline?: string;
    titles?: any[];
}

export const ScriptWritingSection = ({ content, onUpdate, conceptData, outline, titles }: ScriptWritingSectionProps) => {
    const { token } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');




    const handleGenerate = async () => {
        if (!outline || !conceptData) {
            toast.error("Need outline and main concept to generate script");
            return;
        }
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/generate-script`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    outline,
                    titles,
                    conceptData
                })
            });
            if (res.ok) {
                const data = await res.json();
                onUpdate(data.script);
                toast.success("Script generated!");
            } else {
                toast.error("Failed to generate script");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate script");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4">
                    <CardTitle>Script Writing</CardTitle>
                    {outline && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Generate from AI
                        </Button>
                    )}
                </div>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    {viewMode === 'edit' && (
                        <div className="flex justify-end mb-2">
                            <Button
                                size="sm"
                                onClick={() => setViewMode('preview')}
                                className="gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Done
                            </Button>
                        </div>
                    )}
                    {viewMode === 'edit' ? (
                        <Textarea
                            value={content}
                            onChange={(e) => onUpdate(e.target.value)}
                            placeholder="Write your full script here..."
                            className="min-h-[500px] font-mono"
                        />
                    ) : (
                        <div
                            onClick={() => setViewMode('edit')}
                            className="min-h-[500px] overflow-y-auto p-4 border rounded-md bg-transparent prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white [&_*]:!my-0 [&_*]:!mt-0 [&_*]:!mb-0 [&_li]:!leading-snug leading-tight cursor-text hover:bg-muted/10 transition-colors"
                            title="Click to edit"
                        >
                            {content ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                            ) : (
                                <p className="text-muted-foreground italic">No script content yet. Click to start writing or generate with AI.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
};

