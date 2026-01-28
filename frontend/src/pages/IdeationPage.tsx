import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { MainIdeaSection } from "@/components/ideation/MainIdeaSection";
import { TitleBrainstorming } from "@/components/ideation/TitleBrainstorming";
import { ThumbnailBrainstorming } from "@/components/ideation/ThumbnailBrainstorming";
import { ScriptOutlineSection } from "@/components/ideation/ScriptOutlineSection";
import { ScriptWritingSection } from "@/components/ideation/ScriptWritingSection";
import { useAuth } from "@/context/AuthContext";
import { getHeaders } from "@/utils/storage";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { IdeationWizard } from "@/components/ideation/IdeationWizard";
import { API_URL } from "@/config";


interface IdeationProject {
    id: string;
    projectName: string;
    mainIdea: string;
    whyViewerCare: string;
    commonAssumptions: string;
    breakingAssumptions: string;
    viewerFeeling: string;
    targetAudience?: string; // Add new fields
    visualVibe?: string;
    brainstormedTitles: string | { id: string; text: string; score?: number }[];
    brainstormedThumbnails: string | { id: string; type: 'text' | 'image'; content: string }[];
    scriptOutline: string;
    scriptContent: string;
    createdAt: number;
    updatedAt: number;
}

export const IdeationPage = () => {
    const { token, currentSpace } = useAuth();
    const [projects, setProjects] = useState<IdeationProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [currentProject, setCurrentProject] = useState<IdeationProject | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);




    const saveProject = async (silent: boolean = false, projectToSave: IdeationProject | null = currentProject) => {
        if (!projectToSave || !token) return;
        // setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation/${projectToSave.id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    projectName: projectToSave.projectName,
                    mainIdea: projectToSave.mainIdea,
                    whyViewerCare: projectToSave.whyViewerCare,
                    commonAssumptions: projectToSave.commonAssumptions,
                    breakingAssumptions: projectToSave.breakingAssumptions,
                    viewerFeeling: projectToSave.viewerFeeling,
                    targetAudience: projectToSave.targetAudience, // Add new fields
                    visualVibe: projectToSave.visualVibe,
                    brainstormedTitles: projectToSave.brainstormedTitles,
                    brainstormedThumbnails: projectToSave.brainstormedThumbnails,
                    scriptOutline: projectToSave.scriptOutline,
                    scriptContent: projectToSave.scriptContent
                })
            });
            if (res.ok) {
                if (!silent) toast.success("Saved successfully");

                // Update refs and local list
                lastSavedProjectRef.current = JSON.parse(JSON.stringify(projectToSave));

                // Update the project in the list locally to avoid full refetch
                setProjects(prev => prev.map(p => p.id === projectToSave.id ? { ...p, ...projectToSave, updatedAt: Date.now() } : p));
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            if (!silent) toast.error("Failed to save");
            console.error("Auto-save error:", e);
        } finally {
            // setIsSaving(false);
        }
    };

    // Refs for auto-save comparison
    const currentProjectRef = useRef<IdeationProject | null>(null);
    const lastSavedProjectRef = useRef<IdeationProject | null>(null);

    // Update refs when state changes
    useEffect(() => {
        currentProjectRef.current = currentProject;
    }, [currentProject]);

    // Keep latest saveProject function in ref to avoid stale closures in interval
    const saveProjectRef = useRef(saveProject);
    useEffect(() => {
        saveProjectRef.current = saveProject;
    });

    useEffect(() => {
        fetchProjects();
    }, [token, currentSpace]);

    // Auto-save effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (
                currentProjectRef.current &&
                lastSavedProjectRef.current &&
                JSON.stringify(currentProjectRef.current) !== JSON.stringify(lastSavedProjectRef.current)
            ) {
                // Determine if we should save
                // We need to pass the current project from ref to saveProject
                saveProjectRef.current(true, currentProjectRef.current);
            }
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchProjects = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation`, {
                headers: getHeaders()
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
                headers: getHeaders(),
                body: JSON.stringify({ projectName: `New Project ${new Date().toLocaleDateString()}` })
            });
            if (res.ok) {
                const newProject = await res.json();
                setProjects([newProject, ...projects]);
                setSelectedProjectId(newProject.id);
                const parsed = parseProject(newProject);
                setCurrentProject(parsed);
                lastSavedProjectRef.current = JSON.parse(JSON.stringify(parsed)); // Deep copy for ref
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
        currentProjectRef.current = null;
        lastSavedProjectRef.current = null;

        try {
            const res = await fetch(`${API_URL}/api/ideation/${id}`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const project = await res.json();
                const parsed = parseProject(project);
                setCurrentProject(parsed);
                lastSavedProjectRef.current = JSON.parse(JSON.stringify(parsed)); // Deep copy
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
                headers: getHeaders()
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



    const handleSave = () => saveProject(false);

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
            <div className="container mx-auto py-8 space-y-8">
                <Skeleton className="h-12 w-64 mb-8" />
                <div className="grid grid-cols-[300px_1fr] gap-8 h-[calc(100vh-12rem)]">
                    <Skeleton className="h-full rounded-xl" />
                    <Skeleton className="h-full rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <IdeationWizard
            project={currentProject}
            onUpdate={(updates) => setCurrentProject(prev => prev ? ({ ...prev, ...updates }) : null)}
            onSave={() => saveProject(true)} // Silent save
            onBack={() => {
                saveProject(true);
                setSelectedProjectId(null);
            }}
        >
            {(step) => {
                switch (step) {
                    case 0:
                        return (
                            <MainIdeaSection
                                data={currentProject}
                                onChange={(field, value) => setCurrentProject(prev => prev ? ({ ...prev, [field]: value }) : null)}
                            />
                        );
                    case 1:
                        return (
                            <TitleBrainstorming
                                titles={currentProject.brainstormedTitles as any[]}
                                onUpdate={(titles) => setCurrentProject(prev => prev ? ({ ...prev, brainstormedTitles: titles }) : null)}
                                conceptData={currentProject}
                            />
                        );
                    case 2:
                        return (
                            <ThumbnailBrainstorming
                                thumbnails={currentProject.brainstormedThumbnails as any[]}
                                onUpdate={(thumbnails) => setCurrentProject(prev => prev ? ({ ...prev, brainstormedThumbnails: thumbnails }) : null)}
                            />
                        );
                    case 3:
                        return (
                            <ScriptOutlineSection
                                outline={currentProject.scriptOutline}
                                onUpdate={(val) => setCurrentProject(prev => prev ? ({ ...prev, scriptOutline: val }) : null)}
                                conceptData={currentProject}
                            />
                        );
                    case 4:
                        return (
                            <ScriptWritingSection
                                content={currentProject.scriptContent}
                                onUpdate={(val) => setCurrentProject(prev => prev ? ({ ...prev, scriptContent: val }) : null)}
                                conceptData={currentProject}
                                outline={currentProject.scriptOutline}
                                titles={currentProject.brainstormedTitles as any[]}
                            />
                        );
                    default:
                        return <div>Unknown Step</div>;
                }
            }}
        </IdeationWizard>
    );
};
