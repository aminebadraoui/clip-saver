import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Sparkles, LayoutGrid, Lightbulb, Plus } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { sparksApi, type Spark } from "@/utils/sparksApi";
import { fetchMoodboards, createMoodboard, addSparkToMoodboard, type Moodboard } from "@/utils/moodboardApi";
import { createIdeation } from "@/utils/ideationApi";

interface PromoteSparkModalProps {
    spark: Spark;
    isOpen: boolean;
    onClose: () => void;
    onPromoted?: () => void;
}

type PromotionType = 'new-moodboard' | 'existing-moodboard' | 'ideation';

export function PromoteSparkModal({ spark, isOpen, onClose, onPromoted }: PromoteSparkModalProps) {
    const { token, currentSpace } = useAuth();
    const navigate = useNavigate();
    const [type, setType] = useState<PromotionType>('new-moodboard');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
    const [selectedMoodboardId, setSelectedMoodboardId] = useState<string>("");
    const [newName, setNewName] = useState(spark.title || "New Project");

    useEffect(() => {
        if (isOpen && token) {
            loadMoodboards();
            setNewName(spark.title || "New Project");
        }
    }, [isOpen, token]);

    const loadMoodboards = async () => {
        if (!token) return;
        try {
            const data = await fetchMoodboards(token, currentSpace?.id);
            setMoodboards(data);
            if (data.length > 0) setSelectedMoodboardId(data[0].id);
        } catch (e) {
            console.error("Failed to load moodboards", e);
        }
    };

    const handlePromote = async () => {
        if (!token || !currentSpace) return;
        setIsLoading(true);

        try {
            let redirectUrl = "";

            if (type === 'new-moodboard') {
                const mb = await createMoodboard(token, {
                    name: newName,
                    description: `Created from Spark: ${spark.title || 'Untitled'}`,
                    space_id: currentSpace.id
                });
                await addSparkToMoodboard(token, mb.id, spark.id);
                redirectUrl = `/moodboards/${mb.id}`;
                toast.success("Created Moodboard from Spark");
            } else if (type === 'existing-moodboard') {
                if (!selectedMoodboardId) {
                    toast.error("Please select a moodboard");
                    setIsLoading(false);
                    return;
                }
                await addSparkToMoodboard(token, selectedMoodboardId, spark.id);
                redirectUrl = `/moodboards/${selectedMoodboardId}`;
                toast.success("Added Spark to Moodboard");
            } else if (type === 'ideation') {
                const ideation = await createIdeation(token, newName, {
                    mainIdea: spark.content
                });
                // Ideally we'd seed the ideation with spark content here, 
                // but for now we'll just forward user to it where they can reference the spark
                redirectUrl = `/ideation?project=${ideation.id}`;
                toast.success("Started Ideation Project");
            }

            // Mark Spark as processed
            await sparksApi.update(spark.id, { status: 'processed' });

            if (onPromoted) onPromoted();
            onClose();

            // Optional: Ask user if they want to navigate
            toast("Promotion Successful", {
                action: {
                    label: "Open Project",
                    onClick: () => navigate(redirectUrl)
                }
            });

        } catch (error: any) {
            toast.error(error.message || "Failed to promote spark");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Promote Spark
                    </DialogTitle>
                    <DialogDescription>
                        Turn this spark into a bigger project.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <RadioGroup value={type} onValueChange={(v: string) => setType(v as PromotionType)} className="grid grid-cols-1 gap-3">

                        {/* Option 1: New Moodboard */}
                        <div className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${type === 'new-moodboard' ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}>
                            <RadioGroupItem value="new-moodboard" id="new-mb" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="new-mb" className="font-medium cursor-pointer flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4 text-blue-500" />
                                    New Moodboard
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">Create a fresh board starting with this spark.</p>
                                {type === 'new-moodboard' && (
                                    <Input
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="mt-2 h-8 text-sm"
                                        placeholder="Moodboard Name"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Option 2: Add to Existing Moodboard */}
                        <div className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${type === 'existing-moodboard' ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}>
                            <RadioGroupItem value="existing-moodboard" id="exist-mb" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="exist-mb" className="font-medium cursor-pointer flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-green-500" />
                                    Add to Moodboard
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">Append this spark to an existing collection.</p>
                                {type === 'existing-moodboard' && (

                                    <select
                                        className="w-full mt-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={selectedMoodboardId}
                                        onChange={e => setSelectedMoodboardId(e.target.value)}
                                    >
                                        {moodboards.map(mb => (
                                            <option key={mb.id} value={mb.id}>{mb.name}</option>
                                        ))}
                                        {moodboards.length === 0 && <option disabled>No moodboards found</option>}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Option 3: Video Ideation */}
                        <div className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${type === 'ideation' ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}>
                            <RadioGroupItem value="ideation" id="ideation" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="ideation" className="font-medium cursor-pointer flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                                    Start Video Ideation
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">Launch an AI brainstorming session using this spark.</p>
                                {type === 'ideation' && (
                                    <Input
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="mt-2 h-8 text-sm"
                                        placeholder="Project Name"
                                    />
                                )}
                            </div>
                        </div>

                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handlePromote} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Promote
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
