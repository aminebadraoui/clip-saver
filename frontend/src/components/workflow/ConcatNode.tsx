import { type NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Type } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConcatNode({ id, data, selected }: NodeProps) {
    const [separator, setSeparator] = useState(data.separator || ' ');

    useEffect(() => {
        data.op_type = 'concat';
        data.separator = separator;
    }, [separator, data]);

    const inputs = [
        { id: 'input_1', label: 'Text 1' },
        { id: 'input_2', label: 'Text 2' },
        { id: 'input_3', label: 'Text 3' }
    ];

    const outputs = [
        { id: 'output', label: 'Combined' }
    ];

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title="Combine Text"
            icon={Type}
            color="bg-zinc-700"
            inputs={inputs}
            outputs={outputs}
            className="w-[280px]"
        >
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Separator</label>
                <input
                    type="text"
                    className="w-full text-xs p-2 rounded border border-input bg-background"
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    placeholder="Space, comma, etc."
                />
                <p className="text-[10px] text-muted-foreground">
                    Joins inputs with this separator.
                </p>
            </div>
        </NodeWrapper>
    );
}
