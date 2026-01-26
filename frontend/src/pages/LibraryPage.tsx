import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, FileText, Image as ImageIcon, Type } from "lucide-react";
import { toast } from "sonner";

type TemplateType = "titles" | "thumbnails" | "scripts";

interface Template {
    id: string;
    text?: string;
    description?: string;
    structure?: string;
    category: string;
    createdAt: number;
    sources: {
        id: string;
        title: string;
        thumbnail: string;
    }[];
}

import { useAuth } from "@/context/AuthContext";

export function LibraryPage() {
    const { type } = useParams<{ type: string }>();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    const libraryType = (type as TemplateType) || "titles";

    const getTitle = () => {
        switch (libraryType) {
            case "titles": return "Title Library";
            case "thumbnails": return "Thumbnail Library";
            case "scripts": return "Script Library";
            default: return "Library";
        }
    };

    const getIcon = () => {
        switch (libraryType) {
            case "titles": return <Type className="w-6 h-6 mr-2" />;
            case "thumbnails": return <ImageIcon className="w-6 h-6 mr-2" />;
            case "scripts": return <FileText className="w-6 h-6 mr-2" />;
            default: return <FileText className="w-6 h-6 mr-2" />;
        }
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const storedToken = localStorage.getItem("clipcoba_token") || token;
            if (!storedToken) return;

            const response = await fetch(`/api/lab/libraries/${libraryType}`, {
                headers: {
                    "Authorization": `Bearer ${storedToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            } else {
                toast.error("Failed to load library");
            }
        } catch (error) {
            toast.error("Error loading library");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const storedToken = localStorage.getItem("clipcoba_token") || token;
            const response = await fetch(`/api/lab/libraries/${libraryType}/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${storedToken}`
                }
            });

            if (response.ok) {
                toast.success("Template deleted");
                setTemplates(prev => prev.filter(t => t.id !== id));
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting template");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    useEffect(() => {
        fetchTemplates();
    }, [libraryType]);

    const renderContent = (template: Template) => {
        if (libraryType === "titles") return <h3 className="text-xl font-bold">{template.text}</h3>;
        if (libraryType === "thumbnails") return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.description}</p>;
        if (libraryType === "scripts") return <div className="max-h-40 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 p-2 rounded">{template.structure}</div>;
        return null;
    };

    return (
        <div className="container max-w-6xl mx-auto py-8">
            <div className="flex items-center mb-8">
                {getIcon()}
                <h1 className="text-3xl font-bold">{getTitle()}</h1>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No templates saved yet. Go to the Video Lab to extract some!
                        </div>
                    )}
                    {templates.map(template => (
                        <Card key={template.id} className="flex flex-col h-full group hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline">{template.category}</Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(template.text || template.description || template.structure || "")}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDelete(template.id, e)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div>
                                    {renderContent(template)}
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Sources ({template.sources.length})</p>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {template.sources.slice(0, 5).map(source => (
                                            <img
                                                key={source.id}
                                                src={source.thumbnail}
                                                alt={source.title}
                                                title={source.title}
                                                className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                                            />
                                        ))}
                                        {template.sources.length > 5 && (
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-background bg-muted text-[10px] font-medium">
                                                +{template.sources.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
