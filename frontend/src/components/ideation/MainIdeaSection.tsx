import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MainIdeaSectionProps {
    data: {
        mainIdea: string;
        whyViewerCare: string;
        commonAssumptions: string;
        breakingAssumptions: string;
        viewerFeeling: string;
        targetAudience?: string;
        visualVibe?: string;
    };
    onChange: (field: string, value: string) => void;
}

export const MainIdeaSection = ({ data, onChange }: MainIdeaSectionProps) => {
    return (
        <div className="space-y-8">
            <Card className="border-l-4 border-l-primary/50">
                <CardHeader>
                    <CardTitle>Core Concept</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label className="text-base font-semibold">What is the main idea? (The Elevator Pitch)</Label>
                        <Textarea
                            placeholder="e.g. A tutorial on building a React app that explains complex concepts simply..."
                            value={data.mainIdea}
                            onChange={(e) => onChange('mainIdea', e.target.value)}
                            className="min-h-[100px] text-lg"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label className="font-semibold">Target Audience</Label>
                            <Textarea
                                placeholder="Who are we talking to? e.g. 'Beginner Coders', 'Busy Moms'..."
                                value={data.targetAudience || ''}
                                onChange={(e) => onChange('targetAudience', e.target.value)}
                                className="h-24"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="font-semibold">Visual Vibe / Tone</Label>
                            <Textarea
                                placeholder="e.g. 'Fast-paced & Chaotic', 'Calm & Minimalist', 'Cinematic Documentary'..."
                                value={data.visualVibe || ''}
                                onChange={(e) => onChange('visualVibe', e.target.value)}
                                className="h-24"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Value & Emotion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Expectations vs Reality</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
