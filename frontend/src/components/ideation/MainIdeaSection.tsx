import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainIdeaSectionProps {
    data: {
        mainIdea: string;
        whyViewerCare: string;
        commonAssumptions: string;
        breakingAssumptions: string;
        viewerFeeling: string;
    };
    onChange: (field: string, value: string) => void;
}

export const MainIdeaSection = ({ data, onChange }: MainIdeaSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <CardTitle>Main Concept</CardTitle>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </CardHeader>
            {isExpanded && (
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label>What is the main idea?</Label>
                        <Textarea
                            placeholder="e.g. A tutorial on building a React app..."
                            value={data.mainIdea}
                            onChange={(e) => onChange('mainIdea', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label>Why should the viewer care?</Label>
                            <Textarea
                                placeholder="What value do they get?"
                                value={data.whyViewerCare}
                                onChange={(e) => onChange('whyViewerCare', e.target.value)}
                                className="h-32"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>How does the viewer feel throughout?</Label>
                            <Textarea
                                placeholder="Excited? Curious? Empowered?"
                                value={data.viewerFeeling}
                                onChange={(e) => onChange('viewerFeeling', e.target.value)}
                                className="h-32"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label>Common assumptions?</Label>
                            <Textarea
                                placeholder="What do people usually think?"
                                value={data.commonAssumptions}
                                onChange={(e) => onChange('commonAssumptions', e.target.value)}
                                className="h-32"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>How do we break them?</Label>
                            <Textarea
                                placeholder="How is this video different?"
                                value={data.breakingAssumptions}
                                onChange={(e) => onChange('breakingAssumptions', e.target.value)}
                                className="h-32"
                            />
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
