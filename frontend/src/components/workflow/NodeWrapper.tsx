import type { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '../../lib/utils';
import { Settings2, type LucideIcon } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

interface NodeWrapperProps {
    id: string; // Added ID prop
    children: ReactNode;
    selected?: boolean;
    title: string;
    icon?: LucideIcon;
    color?: string; // Tailwind color class for header badge/accent
    inputs?: Array<{ id: string; label?: string }>;
    outputs?: Array<{ id: string; label?: string }>;
    className?: string;
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
}: NodeWrapperProps) {
    const { openSettings } = useWorkflow();

    return (
        <div
            className={cn(
                'min-w-[280px] rounded-xl border bg-black/80 backdrop-blur-md shadow-2xl transition-all duration-300 group',
                selected
                    ? 'border-primary/50 ring-2 ring-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]'
                    : 'border-white/10 hover:border-white/20',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/5 rounded-t-xl">
                <div className={cn("p-1.5 rounded-md text-white shadow-inner", color)}>
                    {Icon && <Icon size={14} strokeWidth={2.5} />}
                </div>
                <span className="font-semibold text-sm tracking-tight text-white/90">{title}</span>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent node selection if we just want settings? Or allow both.
                            openSettings(id);
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Open Settings"
                    >
                        <Settings2 size={14} />
                    </button>
                    {selected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Input Handles */}
                {inputs.length > 0 && (
                    <div className="space-y-4 relative -ml-4">
                        {inputs.map((input) => (
                            <div key={input.id} className="relative flex items-center h-5">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={input.id}
                                    className={cn(
                                        '!w-3 !h-3 !-left-[7px] !border-[3px] !border-black transition-all duration-200',
                                        '!bg-muted-foreground hover:!bg-primary hover:scale-125'
                                    )}
                                />
                                <span className="text-[10px] font-medium text-muted-foreground ml-4 uppercase tracking-wider">
                                    {input.label || input.id}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Body */}
                <div className="text-sm text-gray-300 font-medium">
                    {children}
                </div>

                {/* Output Handles */}
                {outputs.length > 0 && (
                    <div className="space-y-4 relative flex flex-col items-end mt-4 -mr-4">
                        {outputs.map((output) => (
                            <div key={output.id} className="relative flex items-center justify-end h-5 w-full">
                                <span className="text-[10px] font-medium text-muted-foreground mr-4 uppercase tracking-wider text-right">
                                    {output.label || output.id}
                                </span>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={output.id}
                                    className={cn(
                                        '!w-3 !h-3 !-right-[7px] !border-[3px] !border-black transition-all duration-200',
                                        '!bg-primary hover:scale-125 shadow-[0_0_10px_hsl(var(--primary)/0.5)]'
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
