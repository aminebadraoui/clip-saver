import { useState, useEffect, useCallback } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Cpu, Loader2 } from 'lucide-react';
import { workflowApi } from '../../utils/workflowApi';

interface Model {
    model_id: string;
    model_name: string;
    description: string;
    category: string;
    cost_per_run: number;
}

export function ReplicateNode({ id, data, selected }: NodeProps) {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(false);

    // Selected model ID
    const [selectedModel, setSelectedModel] = useState<string>(data.model_id || '');

    useEffect(() => {
        // Fetch models on mount
        const fetchModels = async () => {
            try {
                setLoading(true);
                // Determine category based on some prop or fetch all? Fetch all for now.
                const allModels = await workflowApi.listModels();
                setModels(allModels);

                // Default to first if not set (optional, maybe better to force user choice)
                if (!data.model_id && allModels.length > 0) {
                    // Don't auto-set for now, let user choose
                }
            } catch (err) {
                console.error("Failed to load models", err);
            } finally {
                setLoading(false);
            }
        };
        fetchModels();
    }, []);

    const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModelId = e.target.value;
        setSelectedModel(newModelId);
        data.model_id = newModelId;

        // Find model details to save extra info if needed
        const model = models.find(m => m.model_id === newModelId);
        if (model) {
            data.model_name = model.model_name;
            data.cost = model.cost_per_run;
        }
    }, [data, models]);

    // For now, we hardcode inputs for known model types or just expose "prompt"
    // In a real implementation we would parse the model input schema
    const inputs = [
        { id: 'prompt', label: 'Prompt' },
        { id: 'image', label: 'Image (Optional)' }
    ];

    const outputs = [
        { id: 'output', label: 'Output' }
    ];

    const currentModel = models.find(m => m.model_id === selectedModel);

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title="To Replicate"
            icon={Cpu}
            color="bg-purple-600"
            inputs={inputs}
            outputs={outputs}
            className="w-[320px]"
        >
            <div className="space-y-3">
                {/* Model Selector */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Select Model</label>
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 border rounded">
                            <Loader2 className="animate-spin h-3 w-3" /> Loading models...
                        </div>
                    ) : (
                        <select
                            className="w-full text-xs p-2 rounded border border-input bg-background"
                            value={selectedModel}
                            onChange={handleModelChange}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent node drag when interacting
                        >
                            <option value="" disabled>Choose a model...</option>
                            {models.map(m => (
                                <option key={m.model_id} value={m.model_id}>
                                    {m.model_name} ({m.cost_per_run} credits)
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Model Info */}
                {currentModel && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded border border-muted-foreground/10">
                        {currentModel.description}
                    </div>
                )}

                {/* Dynamic Parameter Fields (simplified for now) */}
                {/* We would render extra fields here for parameters that aren't inputs */}
            </div>
        </NodeWrapper>
    );
}
