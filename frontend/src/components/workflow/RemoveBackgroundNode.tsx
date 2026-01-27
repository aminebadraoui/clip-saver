import { type NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Scissors } from 'lucide-react';
import { useEffect } from 'react';

export function RemoveBackgroundNode({ id, data, selected }: NodeProps) {

    useEffect(() => {
        // Pre-configure for Background Removal
        data.model_id = 'cjwbw/rembg';
        data.model_name = 'RemBG';
        // Initialize parameters if missing, defaults to Subject (return_mask: false)
        if (!data.parameters) data.parameters = { return_mask: false };
    }, [data]);

    const inputs = [
        { id: 'image', label: 'Image' }
    ];

    const outputs = [
        { id: 'output', label: 'Subject (Image)' }
    ];

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title="Remove Background"
            icon={Scissors}
            color="bg-rose-500"
            inputs={inputs}
            outputs={outputs}
            className="w-[280px]"
        >
            <div className="text-xs text-muted-foreground">
                Extracts the main subject from the image using RemBG.
            </div>
        </NodeWrapper>
    );
}
