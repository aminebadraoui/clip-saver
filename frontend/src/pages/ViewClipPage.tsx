import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getClips } from "@/utils/storage";
import type { Clip } from "@/types/clip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Sparkles, FlaskConical, TrendingUp, Eye, Activity, FileText } from "lucide-react";
import YouTube from "react-youtube";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { API_URL } from "@/config";

export function ViewClipPage() {
    const { currentSpace, token } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [clip, setClip] = useState<Clip | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Extraction State
    const [extractedScript, setExtractedScript] = useState("");
    const [extractedTitle, setExtractedTitle] = useState("");
    const [extractedThumbnail, setExtractedThumbnail] = useState("");
    const [isExtracting, setIsExtracting] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState("script");
    const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                const allClips = await getClips();
                const foundClip = allClips.find((c) => c.id === id);
                if (foundClip) {
                    setClip(foundClip);

                    // Auto-generate summary if missing or if it contains a previously saved error
                    if (!foundClip.notes || foundClip.notes.startsWith("Error")) {
                        generateSummary(foundClip.id);
                    }

                    // Pre-load existing templates from the updated API response
                    if (foundClip.script_templates && foundClip.script_templates.length > 0) {
                        setExtractedScript(foundClip.script_templates[0].structure);
                    } else if (foundClip.scriptOutline) {
                        // Fallback to legacy field
                        setExtractedScript(foundClip.scriptOutline);
                    }

                    if (foundClip.title_templates && foundClip.title_templates.length > 0) {
                        setExtractedTitle(foundClip.title_templates[0].text);
                    }

                    if (foundClip.thumbnail_templates && foundClip.thumbnail_templates.length > 0) {
                        setExtractedThumbnail(foundClip.thumbnail_templates[0].description);
                    }
                }
            } catch (e) {
                console.error("Failed to load clip", e);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [id, currentSpace]);

    const generateSummary = async (clipId: string) => {
        try {
            // Check authentication but don't error out hard on auto-fetch, just silently fail or log
            const storedToken = localStorage.getItem('clipcoba_token') || token; // Fallback to localStorage if token state not yet ready
            if (!storedToken) return;

            console.log("Generating Summary. API_URL:", API_URL);
            const response = await fetch(`${API_URL}/api/lab/extract/summary`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${storedToken}` },
                body: JSON.stringify({ clipId })
            });

            if (response.ok) {
                const data = await response.json();
                setClip(prev => prev ? { ...prev, notes: data.summary } : null);
                toast.success("Quick Summary generated!");
            }
        } catch (e) {
            console.error("Failed to generate summary", e);
        }
    };

    const handleExtract = async (type: "script" | "title" | "thumbnail") => {
        if (!clip) return;
        setIsExtracting(true);
        try {
            // Using token from AuthContext
            if (!token) throw new Error("Not authenticated");

            // This endpoint now auto-saves/upserts to the library
            const response = await fetch(`${API_URL}/api/lab/extract/${type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ clipId: clip.id })
            });

            if (!response.ok) throw new Error("Extraction failed");

            const data = await response.json();

            if (type === "script") setExtractedScript(data.structure);
            if (type === "title") setExtractedTitle(data.structure);
            if (type === "thumbnail") setExtractedThumbnail(data.structure);

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} extracted & saved to library!`);
        } catch (e) {
            toast.error("Extraction failed. Please try again.");
            console.error(e);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSaveLibrary = async (type: "script" | "title" | "thumbnail") => {
        if (!clip) return;
        const content = type === "script" ? extractedScript : type === "title" ? extractedTitle : extractedThumbnail;
        if (!content) return toast.error("Nothing to save!");

        try {
            if (!token) throw new Error("Not authenticated");

            const response = await fetch(`${API_URL}/api/lab/save/${type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    content,
                    sourceClipId: clip.id,
                    category: "General"
                })
            });

            if (response.ok) {
                toast.success(`Updated ${type} in library!`);
            } else {
                toast.error("Failed to update");
            }
        } catch (e) {
            toast.error("Error saving");
        }
    };

    // Helper to render content based on viewMode
    const renderContentArea = (
        content: string,
        setContent: (val: string) => void,
        placeholder: string,
        minHeight = "min-h-[400px]"
    ) => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                    <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border">
                        <Button
                            variant={viewMode === "preview" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("preview")}
                            className="h-7 text-xs font-medium px-3"
                        >
                            <Eye className="w-3 h-3 mr-2" /> Preview
                        </Button>
                        <Button
                            variant={viewMode === "edit" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("edit")}
                            className="h-7 text-xs font-medium px-3"
                        >
                            <Activity className="w-3 h-3 mr-2" /> Edit
                        </Button>
                    </div>
                </div>

                <div className={`flex-1 relative ${minHeight} bg-background/50 rounded-md border overflow-hidden transition-all duration-300 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}>
                    {viewMode === "edit" ? (
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={placeholder}
                            className={`w-full h-full resize-none font-mono text-sm bg-transparent border-none focus-visible:ring-0 p-6 leading-relaxed ${minHeight}`}
                        />
                    ) : (
                        <div className={`w-full h-full overflow-y-auto p-6 prose prose-invert max-w-none text-sm prose-p:leading-relaxed prose-headings:font-semibold ${minHeight}`}>
                            {content ? (
                                <ReactMarkdown>{content}</ReactMarkdown>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 italic select-none">
                                    <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                                    {placeholder}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
    if (!clip) return <div className="p-8">Clip not found</div>;

    const viralRatio = clip.viralRatio || 0;
    const outlierScore = clip.outlierScore || 0;

    return (
        <div className="container max-w-7xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-muted-foreground">Video Lab</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Analysis Board (5 cols) */}
                <div className="xl:col-span-5 space-y-6">
                    <Card className="border-none shadow-none bg-transparent">
                        <h1 className="text-3xl font-bold mb-4 leading-tight">{clip.title}</h1>

                        {/* Player */}
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6 ring-1 ring-white/10">
                            <YouTube
                                videoId={clip.videoId}
                                opts={{ playerVars: { start: clip.start, end: clip.end } }}
                                className="w-full h-full"
                                iframeClassName="w-full h-full"
                            />
                        </div>

                        {/* Scores Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <Card className="bg-card/50 backdrop-blur">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                                    <div className="text-2xl font-bold">{viralRatio.toFixed(2)}x</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Viral Score</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 backdrop-blur">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Activity className="w-5 h-5 text-blue-500 mb-2" />
                                    <div className="text-2xl font-bold">{outlierScore.toFixed(1)}x</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Outlier</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 backdrop-blur">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Eye className="w-5 h-5 text-purple-500 mb-2" />
                                    <div className="text-lg font-bold truncate w-full">
                                        {new Intl.NumberFormat('en-US', { notation: "compact" }).format(clip.viewCount || 0)}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Views</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary / Notes */}
                        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground transition-all duration-500 relative group">
                            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Quick Summary
                                </div>
                                {clip.notes && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const newNotes = prompt("Edit Notes:", clip.notes || "");
                                            if (newNotes !== null && newNotes !== clip.notes) {
                                                // Optimistic update
                                                const oldNotes = clip.notes;
                                                setClip({ ...clip, notes: newNotes });

                                                // Save to backend
                                                const token = localStorage.getItem('clipcoba_token');
                                                fetch(`${API_URL}/api/lab/extract/summary`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                                                    body: JSON.stringify({ clipId: clip.id, summary: newNotes })
                                                }).catch(() => {
                                                    toast.error("Failed to save notes");
                                                    setClip({ ...clip, notes: oldNotes });
                                                });
                                            }
                                        }}
                                    >
                                        <Activity className="w-3 h-3" />
                                    </Button>
                                )}
                            </h3>

                            {clip.notes ? (
                                <div
                                    className="leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 whitespace-pre-wrap cursor-pointer hover:bg-background/50 rounded p-1 -m-1 transition-colors"
                                    onClick={() => {
                                        // Same edit logic as button
                                        const newNotes = prompt("Edit Notes:", clip.notes || "");
                                        if (newNotes !== null && newNotes !== clip.notes) {
                                            const oldNotes = clip.notes;
                                            setClip({ ...clip, notes: newNotes });

                                            const token = localStorage.getItem('clipcoba_token');
                                            fetch(`${API_URL}/api/lab/extract/summary`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                                                body: JSON.stringify({ clipId: clip.id, summary: newNotes })
                                            }).catch(() => {
                                                toast.error("Failed to save notes");
                                                setClip({ ...clip, notes: oldNotes });
                                            });
                                        }
                                    }}
                                    title="Click to edit"
                                >
                                    {clip.notes}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 animate-pulse">
                                    <Sparkles className="w-4 h-4 animate-spin text-primary" />
                                    <span>Generating summary...</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* User Notes */}
                    <Card className="border-none shadow-none bg-transparent mt-6">
                        <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground transition-all duration-500 relative group min-h-[150px]">
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> My Notes
                                </div>
                            </h3>
                            <textarea
                                className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 p-0 text-sm leading-relaxed text-muted-foreground placeholder:text-muted-foreground/50"
                                placeholder="Write your own observations, ideas, or to-dos for this video..."
                                value={clip.user_notes || ""}
                                onChange={(e) => {
                                    setClip({ ...clip, user_notes: e.target.value });
                                }}
                                onBlur={() => {
                                    // Auto-save on blur
                                    const token = localStorage.getItem('clipcoba_token');
                                    fetch(`${API_URL}/api/lab/notes`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                                        body: JSON.stringify({ clipId: clip.id, notes: clip.user_notes })
                                    }).then(res => {
                                        if (res.ok) toast.success("Notes saved");
                                        else toast.error("Failed to save notes");
                                    });
                                }}
                            />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Extraction Station (7 cols) */}
                <div className="xl:col-span-7">
                    <Card className="h-full border bg-card/50 backdrop-blur-sm shadow-xl flex flex-col">
                        <CardHeader className="border-b bg-muted/20 pb-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <FlaskConical className="w-5 h-5 text-primary" />
                                        Extraction Station
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Use AI to deconstruct this video into reusable templates.
                                    </p>
                                </div>
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
                                    <TabsTrigger
                                        value="script"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2 font-medium"
                                    >
                                        Script Structure
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="title"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2 font-medium"
                                    >
                                        Title Pattern
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="thumbnail"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2 font-medium"
                                    >
                                        Thumbnail Formula
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>

                        <CardContent className="flex-1 p-6 relative flex flex-col">
                            {/* Script Tab */}
                            <div className={activeTab === "script" ? "flex-1 flex flex-col h-full" : "hidden"}>
                                {renderContentArea(
                                    extractedScript,
                                    setExtractedScript,
                                    "Click 'Extract Structure' to analyze the transcript..."
                                )}

                                {isExtracting && activeTab === "script" && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <Sparkles className="w-8 h-8 text-primary mb-2 animate-spin" />
                                            <span className="font-medium">Analyzing Transcript...</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-4">
                                    <Button variant="outline" onClick={() => handleExtract("script")} disabled={isExtracting}>
                                        <Sparkles className="w-4 h-4 mr-2" /> Extract Structure
                                    </Button>
                                    <Button onClick={() => handleSaveLibrary("script")} disabled={!extractedScript}>
                                        <Save className="w-4 h-4 mr-2" /> Update Library
                                    </Button>
                                </div>
                            </div>

                            {/* Title Tab */}
                            <div className={activeTab === "title" ? "flex-1 flex flex-col h-full" : "hidden"}>
                                {renderContentArea(
                                    extractedTitle,
                                    setExtractedTitle,
                                    "Analyze the title to find the winning pattern...",
                                    "min-h-[200px]"
                                )}

                                {isExtracting && activeTab === "title" && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <Sparkles className="w-8 h-8 text-primary mb-2 animate-spin" />
                                            <span className="font-medium">Analyzing Title...</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-4">
                                    <Button variant="outline" onClick={() => handleExtract("title")} disabled={isExtracting}>
                                        <Sparkles className="w-4 h-4 mr-2" /> Extract Pattern
                                    </Button>
                                    <Button onClick={() => handleSaveLibrary("title")} disabled={!extractedTitle}>
                                        <Save className="w-4 h-4 mr-2" /> Update Library
                                    </Button>
                                </div>
                            </div>

                            {/* Thumbnail Tab */}
                            <div className={activeTab === "thumbnail" ? "flex-1 flex flex-col h-full" : "hidden"}>
                                <div className="mb-4">
                                    <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border bg-black mx-auto">
                                        <img src={clip.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </div>
                                </div>

                                {renderContentArea(
                                    extractedThumbnail,
                                    setExtractedThumbnail,
                                    "AI will describe the composition, text placement, and visual hooks...",
                                    "min-h-[200px]"
                                )}

                                {isExtracting && activeTab === "thumbnail" && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <Sparkles className="w-8 h-8 text-primary mb-2 animate-spin" />
                                            <span className="font-medium">Analyzing Visuals...</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-4">
                                    <Button variant="outline" onClick={() => handleExtract("thumbnail")} disabled={isExtracting}>
                                        <Sparkles className="w-4 h-4 mr-2" /> Extract Formula
                                    </Button>
                                    <Button onClick={() => handleSaveLibrary("thumbnail")} disabled={!extractedThumbnail}>
                                        <Save className="w-4 h-4 mr-2" /> Update Library
                                    </Button>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
