import { type NodeProps, useNodes, useEdges } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Type } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

export function ConcatNode({ id, data, selected }: NodeProps) {
    // Default separator to newline if not set, but we hide controls now
    const [separator] = useState(data.separator || '\n\n---\n\n');

    const nodes = useNodes();
    const edges = useEdges();

    useEffect(() => {
        data.op_type = 'concat';
        data.separator = separator;
    }, [separator, data]);

    // Single input that accepts multiple connections
    // We rely on React Flow allowing multiple connections to one handle by default (unless limit is set)
    const inputs = useMemo(() => [
        { id: 'input', label: 'Inputs' }
    ], []);

    // Calculate Preview based on connected nodes
    const previewText = useMemo(() => {
        // 1. Find all edges connected to our single 'input' handle
        const connectedEdges = edges.filter(e => e.target === id && e.targetHandle === 'input');

        // 2. Find their source nodes
        const sourceItems = connectedEdges.map(edge => {
            const node = nodes.find(n => n.id === edge.source);
            return { node, edge };
        }).filter(item => item.node !== undefined);

        // 3. Sort by Y position (top to bottom) to determine concatenation order
        // @ts-ignore - node is defined from filter above
        sourceItems.sort((a, b) => a.node.position.y - b.node.position.y);

        // 4. Extract values
        const values = sourceItems.map(item => {
            // @ts-ignore
            const nodeData = item.node.data as Record<string, any>;
            const val = nodeData?.value || nodeData?.output || '';

            if (typeof val === 'object') {
                return JSON.stringify(val);
            }
            return String(val);
        });

        // 5. Join
        return values.filter(v => v !== '').join(separator);
    }, [nodes, edges, id, separator]);

    const outputs = [
        { id: 'output', label: 'Combined' }
    ];

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title={data.label || "Combine Text"}
            icon={Type}
            color="bg-zinc-700"
            inputs={inputs}
            outputs={outputs}
            className="w-[320px] h-[320px]"
        >
            <div className="flex flex-col h-full">
                {/* Header Info - Simplified */}
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 shrink-0">
                    <span>Vertical Order = Concat Order</span>
                    {/* Maybe a tiny settings cog later for separator? For now hidden. */}
                </div>

                {/* Preview / Output - Fills space */}
                <div className="flex-1 flex flex-col min-h-0 border-t border-white/10 pt-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-2 shrink-0">
                        {data.output ? "Result" : "Preview"}
                    </label>
                    <div className="flex-1 bg-black/30 p-3 rounded-lg border border-white/5 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                        {data.output || previewText || (
                            <span className="text-gray-600 italic">
                                Connect multiple nodes to 'Inputs'. They will be joined top-to-bottom.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </NodeWrapper>
    );
}
