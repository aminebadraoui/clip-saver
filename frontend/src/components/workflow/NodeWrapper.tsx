import type { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NodeWrapperProps {
    children: ReactNode;
    selected?: boolean;
    title: string;
    icon?: LucideIcon;
    color?: string; // Tailwind color class like 'bg-blue-500'
    inputs?: Array<{ id: string; label?: string }>;
    outputs?: Array<{ id: string; label?: string }>;
    className?: string;
}

export function NodeWrapper({
    children,
    selected,
    title,
    icon: Icon,
    color = 'bg-slate-800', // Default dark theme
    inputs = [],
    outputs = [],
    className,
}: NodeWrapperProps) {
    return (
        <div
            className={cn(
                'min-w-[280px] rounded-lg border bg-card shadow-sm transition-all text-card-foreground',
                selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                className
            )}
        >
            {/* Header */}
            <div className={cn('flex items-center gap-2 px-4 py-2 border-b border-border rounded-t-lg', color, 'text-white')}>
                {Icon && <Icon size={16} />}
                <span className="font-medium text-sm">{title}</span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Input Handles */}
                {inputs.length > 0 && (
                    <div className="space-y-3 relative">
                        {inputs.map((input) => (
                            <div key={input.id} className="relative flex items-center h-5">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={input.id}
                                    className={cn(
                                        '!w-3 !h-3 !-left-[22px] !border-2 !border-background transition-colors hover:bg-primary',
                                        '!bg-muted-foreground'
                                    )}
                                />
                                <span className="text-xs text-muted-foreground ml-2 capitalize">
                                    {input.label || input.id}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Body */}
                <div className="text-sm">
                    {children}
                </div>

                {/* Output Handles */}
                {outputs.length > 0 && (
                    <div className="space-y-3 relative flex flex-col items-end mt-4">
                        {outputs.map((output) => (
                            <div key={output.id} className="relative flex items-center justify-end h-5 w-full">
                                <span className="text-xs text-muted-foreground mr-2 capitalize text-right">
                                    {output.label || output.id}
                                </span>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={output.id}
                                    className={cn(
                                        '!w-3 !h-3 !-right-[22px] !border-2 !border-background transition-colors hover:bg-primary',
                                        '!bg-primary'
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
