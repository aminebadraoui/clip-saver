import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronDown, ChevronUp, Check, RefreshCw, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { InspirationSidebar } from "./InspirationSidebar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { API_URL } from "@/config";
import { workflowApi } from "@/utils/workflowApi";


interface ScriptOutlineSectionProps {
    outline: string;
    onUpdate: (outline: string) => void;
    conceptData?: any;
}

export const ScriptOutlineSection = ({ outline, onUpdate, conceptData }: ScriptOutlineSectionProps) => {
    const { token } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReadapting, setIsReadapting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');




    const pollJob = async (jobId: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const job = await workflowApi.getJob(jobId);
                    if (job.status === 'succeeded') {
                        clearInterval(interval);
                        let content = "";
                        if (Array.isArray(job.output)) {
                            content = job.output.join("");
                        } else {
                            content = String(job.output);
                        }
                        // Clean markdown if present
                        content = content.replace(/```markdown/g, "").replace(/```/g, "").trim();
                        resolve(content);
                    } else if (job.status === 'failed') {
                        clearInterval(interval);
                        reject(new Error(job.error || 'Job failed'));
                    }
                } catch (e) {
                    clearInterval(interval);
                    reject(e);
                }
            }, 2000);
        });
    };

    const handleGenerate = async (source: any) => {
        setIsSidebarOpen(false);

        // Case 1: Library Template (Structure)
        if (source.type === 'structure') {
            const structure = source.content;
            // If outline exists, ask or append? For now append or replace logic could be confusing.
            // Let's append with a separator if exists.
            onUpdate(outline ? outline + "\n\n" + structure : structure);
            toast.success("Structure template added!");
            return;
        }

        // Case 2: Clip (Generate from Transcript)
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/clips/${source.id}/outline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                let resultOutline = "";
                if (data.jobId) {
                    resultOutline = await pollJob(data.jobId);
                } else {
                    resultOutline = data.outline;
                }

                onUpdate(outline ? outline + "\n\n" + resultOutline : resultOutline);
                toast.success("Outline generated from clip!");
            }
        } catch (e) {
            toast.error("Failed to generate outline");
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReadapt = async () => {
        if (!outline) return;
        setIsReadapting(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/readapt-outline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    outline: outline,
                    conceptData: conceptData
                })
            });
            if (res.ok) {
                const data = await res.json();

                let resultOutline = "";
                if (data.jobId) {
                    resultOutline = await pollJob(data.jobId);
                } else {
                    resultOutline = data.outline;
                }

                onUpdate(resultOutline);
                toast.success("Outline readapted for main concept!");
            } else {
                toast.error("Failed to readapt outline");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to readapt outline");
        } finally {
            setIsReadapting(false);
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
                    {outline && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleReadapt(); }}
                            disabled={isReadapting}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                        >
                            {isReadapting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Readapt for Main Concept
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGenerating ? "Generating..." : "Generate from Clip"}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
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
                            value={outline}
                            onChange={(e) => onUpdate(e.target.value)}
                            placeholder="I. Intro..."
                            className="min-h-[300px] max-h-[500px] font-mono"
                            autoFocus
                        />
                    ) : (
                        <div
                            onClick={() => setViewMode('edit')}
                            className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 border rounded-md bg-background prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white [&_*]:!my-0 [&_*]:!mt-0 [&_*]:!mb-0 [&_li]:!leading-snug leading-tight cursor-text hover:bg-muted/10 transition-colors"
                            title="Click to edit"
                        >
                            {outline ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{outline}</ReactMarkdown>
                            ) : (
                                <p className="text-muted-foreground italic">No outline content yet. Click to start writing.</p>
                            )}
                        </div>
                    )}
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
