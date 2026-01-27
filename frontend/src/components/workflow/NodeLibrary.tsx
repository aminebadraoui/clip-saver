import { Type, Image as ImageIcon, Video, Cpu, Scissors, Paintbrush, PenTool, GripVertical, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NodeLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onNodeClick?: (type: string, data: any) => void;
}

export function NodeLibrary({ isOpen, onClose, onNodeClick }: NodeLibraryProps) {
    const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const renderDraggableItem = (type: string, data: any, icon: React.ReactNode, label: string, desc: string, colorClass: string) => (
        <div
            className="group relative flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 cursor-grab active:cursor-grabbing cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
            onDragStart={(event) => onDragStart(event, type, data)}
            onClick={() => onNodeClick?.(type, data)}
            draggable
        >
            <div className={cn("p-2.5 rounded-lg text-white shadow-inner transition-transform group-hover:scale-110", colorClass)}>
                {icon}
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{label}</span>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-wide">{desc}</span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20">
                <GripVertical size={16} />
            </div>
        </div>
    );

    return (
        <div className={cn(
            "fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/10 flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Add Nodes
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">Click or drag to add nodes.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-gray-400 hover:text-white">
                    <X size={20} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">

                    {/* Basic Nodes */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                            Inputs
                        </h3>
                        {renderDraggableItem(
                            'input',
                            { label: 'Input Node' },
                            <Type size={18} />,
                            'Text Input',
                            'Provide prompt/text',
                            'bg-zinc-700'
                        )}
                    </div>

                    {/* Text Models */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Text Models
                        </h3>
                        {renderDraggableItem(
                            'replicate',
                            { model_id: 'meta/llama-2-70b-chat', label: 'Text Generator' },
                            <Type size={18} />,
                            'Text Generator',
                            'Generate text with LLMs',
                            'bg-blue-600'
                        )}
                    </div>

                    {/* Image Models */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Image Models
                        </h3>
                        {renderDraggableItem(
                            'replicate',
                            { model_id: 'stability-ai/sdxl', label: 'Image Generator' },
                            <ImageIcon size={18} />,
                            'Image Generator',
                            'Generate images with SDXL/Flux',
                            'bg-purple-600'
                        )}
                    </div>

                    {/* Video Models */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            Video Models
                        </h3>
                        {renderDraggableItem(
                            'replicate',
                            { model_id: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816f3afc95aa39749c89fe63139d358b8d94b', label: 'Video Generator' },
                            <Video size={18} />,
                            'Video Generator',
                            'Generate videos (SVD/Luma)',
                            'bg-orange-600'
                        )}
                    </div>

                    {/* Processing Nodes */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-800"></span>
                            Image Magic
                        </h3>

                        {renderDraggableItem(
                            'mask_editor',
                            {},
                            <PenTool size={18} />,
                            'Mask Editor',
                            'Manual brush mask',
                            'bg-red-900/80'
                        )}

                        {renderDraggableItem(
                            'remove_bg',
                            {},
                            <Scissors size={18} />,
                            'Remove Background',
                            'Extract subject (Magic Grab)',
                            'bg-red-800'
                        )}

                        {renderDraggableItem(
                            'inpaint',
                            {},
                            <Paintbrush size={18} />,
                            'Magic Inpaint',
                            'Fill area using mask',
                            'bg-red-700'
                        )}
                    </div>

                    {/* Utilities */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                            Logic & Utils
                        </h3>
                        {renderDraggableItem(
                            'concat',
                            { separator: ' ' },
                            <Type size={18} />,
                            'Combine Text',
                            'Concatenate prompts',
                            'bg-zinc-700'
                        )}
                    </div>

                    {/* Outputs */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                            Outputs
                        </h3>
                        {renderDraggableItem(
                            'output',
                            {},
                            <ImageIcon size={18} />,
                            'Result Viewer',
                            'View images/videos',
                            'bg-zinc-800'
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
