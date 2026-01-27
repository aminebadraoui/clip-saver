import { type NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Paintbrush } from 'lucide-react';
import { useEffect } from 'react';

export function InpaintNode({ id, data, selected }: NodeProps) {

    useEffect(() => {
        // Pre-configure for Inpainting
        data.model_id = 'stability-ai/sdxl-inpainting';
        data.model_name = 'SDXL Inpainting';

        // Ensure parameters structure exists
        if (!data.parameters) data.parameters = {};
    }, [data]);

    const inputs = [
        { id: 'image', label: 'Original Image' },
        { id: 'mask', label: 'Mask (Optional)' },
        { id: 'prompt', label: 'Prompt' }
    ];

    const outputs = [
        { id: 'output', label: 'Inpainted Image' }
    ];

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title="Magic Inpaint"
            icon={Paintbrush}
            color="bg-emerald-600"
            inputs={inputs}
            outputs={outputs}
            className="w-[280px]"
        >
            <div className="text-xs text-muted-foreground">
                Fills masked areas based on prompt. Connect 'Mask' to define where to paint.
            </div>
        </NodeWrapper>
    );
}
