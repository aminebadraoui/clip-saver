import { useState, useCallback, useEffect } from 'react';
import { type NodeProps, useReactFlow } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Type, Maximize2, Library } from 'lucide-react';
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

export function InputNode({ id, data, selected }: NodeProps) {
    const { openDetailModal } = useWorkflow();
    const { setNodes } = useReactFlow();
    // Local state for immediate responsiveness
    const [value, setValue] = useState(data.value || '');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const definition = getNodeDefinition(data.definitionId);

    // Check for subtype (title, script)
    const libraryType = definition?.data?.subtype as 'title' | 'script' | undefined;
    const showLibrary = !!libraryType;

    // Sync local state if data changes externally (e.g. undo/redo or load)
    useEffect(() => {
        setValue(data.value || '');
    }, [data.value]);

    // Quick Presets for Text Inputs
    const showPresets = definition?.id === 'input_text';
    const presets = [
        {
            label: "Detailed Image Descriptor",
            text: "Analyze this image and describe it in extreme detail. Focus on the main subject, art style, lighting, color palette, camera angle, and composition. Describe the mood and atmosphere."
        },
        {
            label: "Thumbnail Analysis",
            text: "Analyze this YouTube thumbnail. Describe the visual hook, the text overlay (if any), the facial expressions, and the saturation/contrast. Explain why this thumbnail might be effective at getting clicks."
        }
    ];

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        // data.value = newValue; // Don't mutate directly if we want reactivity downstream
        updateNodeData(id, newValue, setNodes);
    }, [id, setNodes]);

    const applyPreset = (text: string) => {
        setValue(text);
        updateNodeData(id, text, setNodes);
    };

    const handleLibrarySelect = (text: string) => {
        setValue(text);
        updateNodeData(id, text, setNodes);
    };

    return (
        <>
            <NodeWrapper
                id={id}
                selected={selected}
                title={data.label || definition?.label || 'Input'}
                icon={definition?.icon || Type}
                color={data.color || "bg-zinc-600"}
                outputs={[{ id: 'output', label: 'Output' }]}
            >
                <div className="flex flex-col h-full">
                    {/* Header / Controls */}
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <label className="text-xs font-medium text-muted-foreground">
                            {definition?.label || 'Value'}
                        </label>
                        <div className="flex gap-1 items-center">
                            {showLibrary && (
                                <button
                                    className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 text-[10px]"
                                    onClick={() => setIsLibraryOpen(true)}
                                    title="Import from Library"
                                >
                                    <Library size={10} />
                                    <span>Library</span>
                                </button>
                            )}

                            {showPresets && (
                                <>
                                    {presets.map((preset, i) => (
                                        <button
                                            key={i}
                                            className="text-[10px] px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                                            onClick={() => applyPreset(preset.text)}
                                            title={preset.label}
                                        >
                                            {preset.label.split(" ")[0]}...
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Expand Button */}
                            <button
                                className="p-1 bg-white/5 hover:bg-white/20 border border-white/5 rounded-md text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent node drag selection interference
                                    console.log("Expanding text input:", value);
                                    openDetailModal('Text Input', value, 'text');
                                }}
                                title="Expand to Fullscreen"
                            >
                                <Maximize2 size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Input Area - Fills remaining space */}
                    {definition?.id === 'input_text' || showLibrary ? (
                        <textarea
                            className="flex-1 w-full h-full text-xs p-3 rounded-lg border border-input bg-background/50 focus:ring-1 focus:ring-primary font-mono resize-none leading-normal custom-scrollbar whitespace-pre-wrap overflow-y-auto"
                            placeholder={showLibrary ? "Enter content or import from library..." : "Enter text..."}
                            value={value}
                            onChange={handleChange}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <input
                            type={definition?.id === 'input_number' ? 'number' : 'text'}
                            className="w-full text-xs p-2 rounded border border-input bg-background focus:ring-1 focus:ring-primary"
                            placeholder="Enter value..."
                            value={value}
                            onChange={handleChange}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            </NodeWrapper>

            {showLibrary && (
                <IdeationPickerModal
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                    onSelect={handleLibrarySelect}
                    type={libraryType!}
                />
            )}
        </>
    );
}
