import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { workflowApi } from '@/utils/workflowApi';
import { executeTemplate, THUMBNAIL_GENERATOR_TEMPLATE } from '@/utils/workflowTemplates';
import type { Clip } from '@/types/clip';

interface ThumbnailGeneratorProps {
    clip: Clip;
    onSuccess?: (thumbnailUrl: string) => void;
}

export function ThumbnailGenerator({ clip, onSuccess }: ThumbnailGeneratorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            setError(null);

            // Create workflow from template
            const workflowData = await executeTemplate(THUMBNAIL_GENERATOR_TEMPLATE.id, {
                clip_title: clip.title,
            });

            // Create temporary workflow
            const workflow = await workflowApi.create({
                name: `Thumbnail for: ${clip.title}`,
                description: 'Auto-generated thumbnail workflow',
                workflow_data: workflowData,
            });

            // Execute workflow
            const execution = await workflowApi.execute(workflow.id, {
                clip_title: clip.title,
            });

            // Use SSE for real-time updates
            const eventSource = workflowApi.streamExecution(
                execution.id,
                (data) => {
                    // Handle status updates
                    if (data.status === 'completed' && data.outputs?.thumbnail) {
                        setGeneratedUrl(data.outputs.thumbnail);
                        setIsGenerating(false);
                        if (onSuccess) onSuccess(data.outputs.thumbnail);
                        eventSource.close();
                    } else if (data.status === 'failed') {
                        setError(data.error_message || 'Generation failed');
                        setIsGenerating(false);
                        eventSource.close();
                    }
                    // For 'running' status, just keep the loading state
                },
                (error) => {
                    console.error('SSE error:', error);
                    setError('Connection error. Please try again.');
                    setIsGenerating(false);
                }
            );

        } catch (err) {
            console.error('Failed to generate thumbnail:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate thumbnail');
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (generatedUrl) {
            window.open(generatedUrl, '_blank');
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <Wand2 size={16} />
                Generate Thumbnail
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Generate YouTube Thumbnail</DialogTitle>
                        <DialogDescription>
                            Create an AI-generated thumbnail for: <strong>{clip.title}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {!generatedUrl && !isGenerating && (
                            <div className="text-center py-8">
                                <Wand2 size={48} className="mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    This will use <strong>2 credits</strong> to generate a 2K thumbnail using Google Nano Banana Pro
                                </p>
                                <Button onClick={handleGenerate} className="gap-2">
                                    <Wand2 size={16} />
                                    Generate Thumbnail (2 credits)
                                </Button>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="text-center py-8">
                                <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Generating your thumbnail...
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    This usually takes 10-30 seconds
                                </p>
                            </div>
                        )}

                        {generatedUrl && (
                            <div className="space-y-4">
                                <img
                                    src={generatedUrl}
                                    alt="Generated thumbnail"
                                    className="w-full rounded-lg border"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleDownload} className="flex-1">
                                        Download Thumbnail
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setGeneratedUrl(null);
                                            handleGenerate();
                                        }}
                                    >
                                        Generate Another
                                    </Button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8">
                                <p className="text-sm text-red-600 mb-4">{error}</p>
                                <Button variant="outline" onClick={() => setError(null)}>
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
