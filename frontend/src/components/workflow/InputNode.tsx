import { useState, useCallback } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Type } from 'lucide-react';

export function InputNode({ data, selected }: NodeProps) {
    const [value, setValue] = useState(data.value || '');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        // Update reactflow data
        data.value = newValue;
    }, [data]);

    return (
        <NodeWrapper
            selected={selected}
            title="Input"
            icon={Type}
            color="bg-indigo-600"
            outputs={[{ id: 'output', label: 'Text' }]}
        >
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                    Prompt / Text
                </label>
                <textarea
                    className="w-full text-xs p-2 rounded border border-input bg-background focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
                    placeholder="Enter your prompt here..."
                    value={value}
                    onChange={handleChange}
                    onKeyDown={(e) => e.stopPropagation()} // Stop reactflow from catching key events
                />
            </div>
        </NodeWrapper>
    );
}
