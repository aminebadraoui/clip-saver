
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScriptWritingSectionProps {
    content: string;
    onUpdate: (content: string) => void;
}

export const ScriptWritingSection = ({ content, onUpdate }: ScriptWritingSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <CardTitle>Script Writing</CardTitle>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <Textarea
                        value={content}
                        onChange={(e) => onUpdate(e.target.value)}
                        placeholder="Write your full script here..."
                        className="min-h-[500px] font-mono text-lg"
                    />
                </CardContent>
            )}
        </Card>
    );
};

