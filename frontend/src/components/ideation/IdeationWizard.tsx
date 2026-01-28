import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeationProject {
    id: string;
    projectName: string;
    mainIdea: string;
    whyViewerCare: string;
    commonAssumptions: string;
    breakingAssumptions: string;
    viewerFeeling: string;
    targetAudience?: string;
    visualVibe?: string;
    brainstormedTitles: string | any[];
    brainstormedThumbnails: string | any[];
    scriptOutline: string;
    scriptContent: string;
}

interface IdeationWizardProps {
    project: IdeationProject;
    onUpdate: (updates: Partial<IdeationProject>) => void;
    onSave: () => void;
    onBack?: () => void;
    children: (step: number) => React.ReactNode;
}

const STEPS = [
    { id: 'concept', label: 'The Spark', description: 'Define the core concept & audience' },
    { id: 'titles', label: 'The Hooks', description: 'Brainstorm viral titles' },
    { id: 'thumbnails', label: 'The Visuals', description: 'Design key imagery' },
    { id: 'outline', label: 'The Blueprint', description: 'Structure the narrative' },
    { id: 'script', label: 'The Script', description: 'Write the full content' }
];

export const IdeationWizard = ({ project, onSave, onBack, children }: IdeationWizardProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
            onSave(); // Auto-save on step change
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar Navigation */}
            <div className="w-80 border-r bg-muted/10 flex flex-col">
                <div className="p-6 border-b">
                    <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={onBack}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Projects
                    </Button>
                    <h2 className="font-bold text-xl truncate" title={project.projectName}>
                        {project.projectName}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Video Strategy</p>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <div className="space-y-1 px-4">
                        {STEPS.map((step, index) => {
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStep(index)}
                                    className={cn(
                                        "w-full flex items-start text-left p-3 rounded-lg transition-colors relative group",
                                        isActive ? "bg-primary/10" : "hover:bg-muted"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 border transition-colors",
                                        isActive ? "border-primary bg-primary text-primary-foreground" :
                                            isCompleted ? "border-primary/50 text-primary" : "border-muted-foreground text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className={cn("font-medium text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                                            {step.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground/60 mt-0.5">
                                            {step.description}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t bg-background">
                    <div className="text-xs text-center text-muted-foreground">
                        {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
                    </div>
                    <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                <div className="flex-1 overflow-y-auto p-8 lg:px-12 max-w-5xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{STEPS[currentStep].label}</h1>
                        <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {children(currentStep)}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="border-t bg-background/95 backdrop-blur p-4 flex justify-between items-center px-8 lg:px-12">
                    <Button
                        variant="ghost"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onSave} className="mr-2">
                            Save Progress
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={currentStep === STEPS.length - 1}
                            className="min-w-[120px]"
                        >
                            {currentStep === STEPS.length - 1 ? "Finish" : "Next Step"}
                            {currentStep !== STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
