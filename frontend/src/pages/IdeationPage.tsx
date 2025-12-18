import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, Save, Loader2, ArrowRight, Trash2 } from "lucide-react";
import { MainIdeaSection } from "@/components/ideation/MainIdeaSection";
import { TitleBrainstorming } from "@/components/ideation/TitleBrainstorming";
import { ThumbnailBrainstorming } from "@/components/ideation/ThumbnailBrainstorming";
import { ScriptOutlineSection } from "@/components/ideation/ScriptOutlineSection";
import { ScriptWritingSection } from "@/components/ideation/ScriptWritingSection";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";


interface IdeationProject {
    id: string;
    projectName: string;
    mainIdea: string;
    whyViewerCare: string;
    commonAssumptions: string;
    breakingAssumptions: string;
    viewerFeeling: string;
    brainstormedTitles: string | { id: string; text: string; score?: number }[];
    brainstormedThumbnails: string | { id: string; type: 'text' | 'image'; content: string }[];
    scriptOutline: string;
    scriptContent: string;
    createdAt: number;
    updatedAt: number;
}

export const IdeationPage = () => {
    const { token } = useAuth();
    const [projects, setProjects] = useState<IdeationProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [currentProject, setCurrentProject] = useState<IdeationProject | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        fetchProjects();
    }, [token]);

    const fetchProjects = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (e) {
            console.error("Failed to fetch projects", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ projectName: `New Project ${new Date().toLocaleDateString()}` })
            });
            if (res.ok) {
                const newProject = await res.json();
                setProjects([newProject, ...projects]);
                setSelectedProjectId(newProject.id);
                setCurrentProject(parseProject(newProject));
                toast.success("Project created!");
            }
        } catch (e) {
            toast.error("Failed to create project");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadProject = async (id: string) => {
        setIsLoading(true);
        setSelectedProjectId(id); // Switch to detail view immediately to show skeleton
        setCurrentProject(null); // Clear current project to ensure skeleton renders
        try {
            const res = await fetch(`${API_URL}/api/ideation/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const project = await res.json();
                setCurrentProject(parseProject(project));
            }
        } catch (e) {
            toast.error("Failed to load project");
            setSelectedProjectId(null); // Go back to list on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setProjectToDelete(id);
    };

    const confirmDelete = async () => {
        if (!token || !projectToDelete) return;

        try {
            const res = await fetch(`${API_URL}/api/ideation/${projectToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setProjects(prev => prev.filter(p => p.id !== projectToDelete));
                toast.success("Project deleted");
            } else {
                toast.error("Failed to delete project");
            }
        } catch (e) {
            toast.error("Failed to delete project");
        } finally {
            setProjectToDelete(null);
        }
    };

    const parseProject = (project: IdeationProject) => {
        // Parse JSON strings back to objects if needed
        return {
            ...project,
            brainstormedTitles: typeof project.brainstormedTitles === 'string'
                ? JSON.parse(project.brainstormedTitles || '[]')
                : project.brainstormedTitles || [],
            brainstormedThumbnails: typeof project.brainstormedThumbnails === 'string'
                ? JSON.parse(project.brainstormedThumbnails || '[]')
                : project.brainstormedThumbnails || [],
            mainIdea: project.mainIdea || "",
            whyViewerCare: project.whyViewerCare || "",
            commonAssumptions: project.commonAssumptions || "",
            breakingAssumptions: project.breakingAssumptions || "",
            viewerFeeling: project.viewerFeeling || "",
            scriptOutline: project.scriptOutline || "",
            scriptContent: project.scriptContent || ""
        };
    };

    const handleSave = async () => {
        if (!currentProject || !token) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/${currentProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectName: currentProject.projectName,
                    mainIdea: currentProject.mainIdea,
                    whyViewerCare: currentProject.whyViewerCare,
                    commonAssumptions: currentProject.commonAssumptions,
                    breakingAssumptions: currentProject.breakingAssumptions,
                    viewerFeeling: currentProject.viewerFeeling,
                    brainstormedTitles: currentProject.brainstormedTitles,
                    brainstormedThumbnails: currentProject.brainstormedThumbnails,
                    scriptOutline: currentProject.scriptOutline,
                    scriptContent: currentProject.scriptContent
                })
            });
            if (res.ok) {
                toast.success("Saved successfully");
                // Update the project in the list locally to avoid full refetch
                setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, ...currentProject, updatedAt: Date.now() } : p));
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    if (!selectedProjectId) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Video Ideation</h1>
                    <Button onClick={handleCreateProject} disabled={isLoading}>
                        <Plus className="w-4 h-4 mr-2" />
                        {isLoading ? "Creating..." : "New Project"}
                    </Button>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading && projects.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="h-[120px]">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                            </Card>
                        ))
                    ) : (
                        projects.map(p => (
                            <Card key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleLoadProject(p.id)}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center gap-2">
                                        <span className="truncate">{p.projectName}</span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:text-destructive"
                                                onClick={(e) => handleDeleteProject(e, p.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </CardTitle>
                                    <CardDescription>
                                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))
                    )}

                    {!isLoading && projects.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            No projects yet. Start one!
                        </div>
                    )}
                </div>

                <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Project</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this project? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    if (!currentProject || isLoading) {
        return (
            <div className="container mx-auto py-4 space-y-8">
                <div className="flex items-center justify-between mb-6 py-2 border-b">
                    <div className="flex items-center gap-4 flex-1 mr-4">
                        <Skeleton className="w-10 h-10 rounded-md" /> {/* Back Button */}
                        <Skeleton className="flex-1 h-10 max-w-xl" /> {/* Title Input */}
                    </div>
                    <Skeleton className="w-32 h-10" /> {/* Save Button */}
                </div>

                {/* Main Idea Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>

                {/* Split Sections Skeleton */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                </div>

                {/* Outline Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-[150px] w-full rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4">
            <div className="flex items-center justify-between mb-6 py-2 border-b">
                <div className="flex items-center gap-4 flex-1 mr-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProjectId(null)}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="relative flex-1 max-w-2xl">
                        <Input
                            className="text-xl font-bold h-10 py-2 px-3 border border-transparent hover:border-input focus:border-ring bg-transparent transition-all w-full"
                            value={currentProject.projectName}
                            onChange={(e) => setCurrentProject(prev => prev ? ({ ...prev, projectName: e.target.value }) : null)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                            <span className="text-xs">Edit</span>
                        </div>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="space-y-8 pb-20">
                <section id="concept">
                    <MainIdeaSection
                        data={currentProject}
                        onChange={(field, value) => setCurrentProject(prev => prev ? ({ ...prev, [field]: value }) : null)}
                    />
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                    <section id="titles">
                        <TitleBrainstorming
                            titles={currentProject.brainstormedTitles as any[]}
                            onUpdate={(titles) => setCurrentProject(prev => prev ? ({ ...prev, brainstormedTitles: titles }) : null)}
                        />
                    </section>
                    <section id="thumbnails">
                        <ThumbnailBrainstorming
                            thumbnails={currentProject.brainstormedThumbnails as any[]}
                            onUpdate={(thumbnails) => setCurrentProject(prev => prev ? ({ ...prev, brainstormedThumbnails: thumbnails }) : null)}
                        />
                    </section>
                </div>

                <section id="outline">
                    <ScriptOutlineSection
                        outline={currentProject.scriptOutline}
                        onUpdate={(val) => setCurrentProject(prev => prev ? ({ ...prev, scriptOutline: val }) : null)}
                    />
                </section>

                <section id="script">
                    <ScriptWritingSection
                        content={currentProject.scriptContent}
                        onUpdate={(val) => setCurrentProject(prev => prev ? ({ ...prev, scriptContent: val }) : null)}
                    />
                </section>
            </div>
        </div>
    );
};
