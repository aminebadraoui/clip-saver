import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { cn } from '../../lib/utils';
import { Settings2, X, Play, Loader2, type LucideIcon } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

interface NodeWrapperProps {
    id: string;
    children: ReactNode;
    selected?: boolean;
    title: string;
    icon?: LucideIcon;
    color?: string;
    inputs?: Array<{ id: string; label?: string }>;
    outputs?: Array<{ id: string; label?: string }>;
    className?: string;
    onRun?: () => void;
    isRunning?: boolean;
}

export function NodeWrapper({
    id,
    children,
    selected,
    title,
    icon: Icon,
    color = 'bg-primary',
    inputs = [],
    outputs = [],
    className,
    onRun,
    isRunning = false,
}: NodeWrapperProps) {
    const { openSettings, deleteNode } = useWorkflow();
    const { setNodes } = useReactFlow();

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Update local edit value if title changes externally
    useEffect(() => {
        setEditValue(title);
    }, [title]);

    const handleSave = () => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== title) {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                label: editValue,
                            },
                        };
                    }
                    return node;
                })
            );
        } else {
            setEditValue(title); // Revert if empty
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(title);
        }
        e.stopPropagation(); // Prevent react flow from catching key events
    };

    return (
        <div
            className={cn(
                'w-96 h-96 flex flex-col rounded-2xl border bg-[#0a0a0a] shadow-2xl transition-all duration-300 group',
                selected
                    ? 'border-primary/50 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]'
                    : 'border-white/5 hover:border-white/10 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)]',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-white/[0.02] rounded-t-2xl relative"
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
            >
                <div className={cn("p-1.5 rounded-lg text-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]", color)}>
                    {Icon && <Icon size={14} strokeWidth={2.5} />}
                </div>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-black/50 border border-white/10 rounded text-sm px-2 py-0.5 text-white focus:outline-none focus:border-primary/50 font-medium tracking-tight"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="font-medium text-sm tracking-tight text-white/90 select-none cursor-text truncate flex-1" title="Double click to rename">
                        {title}
                    </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                    {onRun && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRun();
                            }}
                            disabled={isRunning}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all mr-2",
                                isRunning
                                    ? "bg-primary/20 text-primary border border-primary/20 cursor-wait"
                                    : "bg-white/5 text-gray-300 hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.5)] border border-white/10 hover:border-primary/50"
                            )}
                            title="Run Model"
                        >
                            {isRunning ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                            <span>{isRunning ? 'Running' : 'Run'}</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(id);
                        }}
                        className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Node"
                    >
                        <X size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openSettings(id);
                        }}
                        className="p-1.5 rounded-md text-white/20 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Open Settings"
                    >
                        <Settings2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-4 min-h-0 relative">
                {/* Input Handles */}
                {inputs.length > 0 && (
                    <div className="space-y-5 relative -ml-5 mt-1">
                        {inputs.map((input) => (
                            <div key={input.id} className="relative flex items-center h-5 group/handle">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={input.id}
                                    className={cn(
                                        '!w-3.5 !h-3.5 !-left-[7px] !border-[3px] !border-[#0a0a0a] transition-all duration-300',
                                        '!bg-zinc-600 group-hover/handle:!bg-primary group-hover/handle:scale-110'
                                    )}
                                />
                                <span className="text-[10px] font-medium text-zinc-500 ml-3 uppercase tracking-wider group-hover/handle:text-zinc-300 transition-colors">
                                    {input.label || input.id}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Body */}
                <div className="flex-1 flex flex-col text-sm text-zinc-400 font-normal min-h-0">
                    {children}
                </div>

                {/* Output Handles */}
                {outputs.length > 0 && (
                    <div className="space-y-5 relative flex flex-col items-end mt-4 -mr-5 mb-1">
                        {outputs.map((output) => (
                            <div key={output.id} className="relative flex items-center justify-end h-5 w-full group/handle">
                                <span className="text-[10px] font-medium text-zinc-500 mr-3 uppercase tracking-wider text-right group-hover/handle:text-zinc-300 transition-colors">
                                    {output.label || output.id}
                                </span>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={output.id}
                                    className={cn(
                                        '!w-3.5 !h-3.5 !-right-[7px] !border-[3px] !border-[#0a0a0a] transition-all duration-300',
                                        '!bg-zinc-600 group-hover/handle:!bg-primary group-hover/handle:scale-110 hover:!shadow-[0_0_10px_hsl(var(--primary)/0.5)]'
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
