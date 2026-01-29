import React from 'react';
import { SparkList } from "@/components/sparks/SparkList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, CheckCircle2, Archive } from 'lucide-react';

export function SparksPage() {
    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Sparks</h1>
            </div>

            <div className="prose dark:prose-invert max-w-none text-muted-foreground mb-8">
                <p>
                    Capture your quick ideas, thoughts, and inspirations here.
                    Process them into Moodboards or Video Ideations later.
                </p>
            </div>

            <Tabs defaultValue="inbox" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                    <TabsTrigger value="inbox" className="flex items-center gap-2">
                        <Inbox className="w-4 h-4" /> Inbox
                    </TabsTrigger>
                    <TabsTrigger value="processed" className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Processed
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="flex items-center gap-2">
                        <Archive className="w-4 h-4" /> Archived
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="mt-0">
                    <SparkList status="inbox" />
                </TabsContent>
                <TabsContent value="processed" className="mt-0">
                    <SparkList status="processed" />
                </TabsContent>
                <TabsContent value="archived" className="mt-0">
                    <SparkList status="archived" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
