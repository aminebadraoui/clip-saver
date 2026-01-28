import { Plus, X, GripVertical, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NODE_CATEGORIES, NODE_DEFINITIONS, type NodeDefinition } from './nodeConfig';
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from './workflowTemplates';

interface NodeLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onNodeClick?: (type: string, data: any) => void;
    onTemplateClick?: (template: WorkflowTemplate) => void;
}

export function NodeLibrary({ isOpen, onClose, onNodeClick, onTemplateClick }: NodeLibraryProps) {
    const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const renderNodeItem = (def: NodeDefinition, categoryColor: string) => {
        const Icon = def.icon;

        return (
            <div
                key={def.id}
                className="group relative flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 cursor-grab active:cursor-grabbing cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                onDragStart={(event) => onDragStart(event, def.type, {
                    definitionId: def.id,
                    model_id: def.modelId // Important for backend execution
                })}
                onClick={() => onNodeClick?.(def.type, {
                    definitionId: def.id,
                    model_id: def.modelId
                })}
                draggable
            >
                <div className={cn("p-2.5 rounded-lg text-white shadow-inner transition-transform group-hover:scale-110", categoryColor)}>
                    <Icon size={18} />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{def.label}</span>
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-wide line-clamp-1" title={def.description}>
                        {def.description}
                    </span>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20">
                    <GripVertical size={16} />
                </div>
            </div>
        );
    };

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
                    <p className="text-xs text-muted-foreground mt-1">Drag and drop to add nodes</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-gray-400 hover:text-white">
                    <X size={20} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">
                    {/* Templates Section */}
                    {WORKFLOW_TEMPLATES.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                Templates
                            </h3>
                            <div className="space-y-3">
                                {WORKFLOW_TEMPLATES.map(template => (
                                    <div
                                        key={template.id}
                                        className="group relative flex items-center gap-3 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/30 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-yellow-900/20 hover:-translate-y-0.5"
                                        onClick={() => onTemplateClick?.(template)}
                                    >
                                        <div className="p-2.5 rounded-lg text-yellow-500 bg-yellow-500/10 shadow-inner transition-transform group-hover:scale-110">
                                            <LayoutTemplate size={18} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{template.label}</span>
                                            <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-wide line-clamp-1" title={template.description}>
                                                {template.description}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-white/10 my-4" />

                    {NODE_CATEGORIES.map(category => {
                        const categoryNodes = NODE_DEFINITIONS.filter(node => node.category === category.id);
                        if (categoryNodes.length === 0) return null;

                        return (
                            <div key={category.id} className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", category.color)}></span>
                                    {category.label}
                                </h3>
                                <div className="space-y-3">
                                    {categoryNodes.map(node => renderNodeItem(node, category.color))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
