
import { type NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { getNodeDefinition } from './nodeConfig';
import { cn } from '@/lib/utils';
import { Sparkles, AlertTriangle, Play, Loader2 } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export function LLMNode({ id, data, selected }: NodeProps) {
    const { runNode, openDetailModal } = useWorkflow();
    // Debug logging
    // console.log(`Rendering LLMNode ${id}`, data);

    // data.definitionId should hold 'gpt-5', 'gemini-3', etc.
    const definition = getNodeDefinition(data.definitionId);

    if (!definition) {
        return (
            <div
                className="p-3 bg-red-900/20 border border-red-500/50 rounded-xl min-w-[180px] backdrop-blur-sm"
                style={{ width: '280px', height: '100px' }}
            >
                <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold">Unknown Node</span>
                </div>
                <div className="text-[10px] text-red-300/70 font-mono break-all">
                    ID: {data.definitionId || 'undefined'}
                </div>
            </div>
        );
    }

    const Icon = definition.icon || Sparkles;

    const handleExpand = (type: 'text' | 'image', content: string) => {
        openDetailModal(definition?.label || 'Output', content, type);
    };

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title={data.label || definition.label || 'LLM Model'}
            icon={Icon}
            color={data.color || "bg-blue-600"}
            inputs={definition?.inputs?.map(i => ({ id: i.name, label: i.label || i.name }))}
            outputs={definition?.outputs?.map(o => ({ id: o.name, label: o.label || o.name }))}
            onRun={() => runNode(id)}
            isRunning={data.loading}
        >
            <div className="relative group/node h-full flex flex-col">
                {/* Content */}
                {data.loading ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-primary gap-2 h-full">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-[10px] font-mono text-primary/70 animate-pulse">GENERATING...</span>
                    </div>
                ) : (
                    <div className="space-y-3 flex-1">
                        {/* Render Output */}
                        {data.output ? (
                            <div className="space-y-2 h-full">
                                {/* Check content type */}
                                {typeof data.output === 'string' && (data.output.startsWith('http') || data.output.startsWith('data:')) ? (
                                    <div
                                        className="relative rounded-lg overflow-hidden border border-white/10 group/image cursor-pointer h-full max-h-60"
                                        onClick={() => handleExpand('image', data.output)}
                                    >
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity z-10">
                                            <div className="bg-black/80 p-2 rounded-full text-white text-xs">Click to Expand</div>
                                        </div>
                                        <img src={data.output} className="w-full h-full object-contain" alt="Output" />
                                    </div>
                                ) : (
                                    <div
                                        className="bg-black/30 p-3 rounded-lg border border-white/5 text-xs text-gray-300 font-mono whitespace-pre-wrap cursor-pointer hover:bg-white/5 transition-colors group/text relative h-full overflow-hidden"
                                        onClick={() => handleExpand('text', typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2))}
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover/text:opacity-100 pointer-events-none sticky">
                                            <span className="text-[10px] text-gray-500">Click to expand</span>
                                        </div>
                                        <div className="h-full overflow-y-auto custom-scrollbar pb-12">
                                            {typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-gray-500 italic border border-dashed border-white/10 rounded-lg min-h-[100px]">
                                No output generated
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeWrapper>
    );
}
