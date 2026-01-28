import { useState, useCallback } from 'react';
import { type NodeProps, useReactFlow } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Image as ImageIcon, Mic, Upload, Library } from 'lucide-react';
import { getNodeDefinition } from './nodeConfig';
import { useWorkflow } from '../../context/WorkflowContext';
import { IdeationPickerModal } from './IdeationPickerModal';

// Helper to update node data immutably
const updateNodeData = (id: string, newValue: string, setNodes: any) => {
    setNodes((nds: any[]) =>
        nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        value: newValue,
                    },
                };
            }
            return node;
        })
    );
};

export function MediaInputNode({ id, data, selected }: NodeProps) {
    const { openMediaPicker, openDetailModal } = useWorkflow();
    const { setNodes } = useReactFlow();
    const [value, setValue] = useState(data.value || '');
    const [isIdeationOpen, setIsIdeationOpen] = useState(false);
    const definition = getNodeDefinition(data.definitionId);

    // Check for subtype
    const libraryType = definition?.data?.subtype as 'thumbnail' | undefined;
    const showIdeation = libraryType === 'thumbnail';

    // Fallback if no definition found (though it should exist)
    const label = definition?.label || 'Media Input';
    const Icon = definition?.icon || ImageIcon;
    const inputType = definition?.id === 'input_video' ? 'video' :
        definition?.id === 'input_audio' ? 'audio' : 'image';

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        updateNodeData(id, newValue, setNodes);
    }, [id, setNodes]);

    const handleSelect = (url: string) => {
        setValue(url);
        updateNodeData(id, url, setNodes);
    };

    return (
        <>
            <NodeWrapper
                id={id}
                selected={selected}
                title={data.label || label}
                icon={Icon}
                color={data.color || "bg-zinc-700"}
                outputs={definition?.outputs.map(o => ({ id: o.name, label: o.label || o.name })) || [{ id: 'output', label: 'Output' }]}
            >
                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                            <span>{inputType === 'video' ? 'Video URL' : inputType === 'audio' ? 'Audio URL' : 'Image URL'}</span>
                            {showIdeation && (
                                <button
                                    className="px-2 py-0.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-md text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1.5 text-[10px]"
                                    onClick={() => setIsIdeationOpen(true)}
                                    title="Import Thumbnail from Library"
                                >
                                    <Library size={10} />
                                    <span>Library</span>
                                </button>
                            )}
                        </label>
                        <input
                            type="text"
                            className="w-full text-xs p-2 rounded border border-input bg-background focus:ring-1 focus:ring-primary"
                            placeholder={`https://...`}
                            value={value}
                            onChange={handleChange}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Visual Preview Placeholder */}
                    {value && (
                        <div
                            className="relative rounded-md overflow-hidden bg-black/20 border border-white/5 aspect-video flex items-center justify-center group cursor-pointer"
                            onClick={() => openDetailModal && openDetailModal(label, value, 'image')}
                        >
                            {inputType === 'image' && <img src={value} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                            {inputType === 'video' && <video src={value} className="w-full h-full object-cover" />}
                            {inputType === 'audio' && <div className="p-4"><Mic className="w-8 h-8 opacity-50" /></div>}

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                <div className="bg-black/80 p-1.5 rounded-full text-white text-[10px]">Expand</div>
                            </div>
                        </div>
                    )}

                    {!value && (
                        <div className="flex gap-2">
                            <div
                                className="flex-1 border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                                onClick={() => openMediaPicker && openMediaPicker(handleSelect)}
                            >
                                <Upload size={16} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[10px] group-hover:text-white transition-colors">Select Asset</span>
                            </div>

                            {showIdeation && (
                                <div
                                    className="flex-1 border border-dashed border-pink-500/10 rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground bg-pink-500/5 hover:bg-pink-500/10 transition-colors cursor-pointer group"
                                    onClick={() => setIsIdeationOpen(true)}
                                >
                                    <Library size={16} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity text-pink-400" />
                                    <span className="text-[10px] group-hover:text-pink-300 text-pink-500/70 transition-colors">Import Idea</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </NodeWrapper>

            {showIdeation && (
                <IdeationPickerModal
                    isOpen={isIdeationOpen}
                    onClose={() => setIsIdeationOpen(false)}
                    onSelect={handleSelect}
                    type="thumbnail"
                />
            )}
        </>
    );
}
