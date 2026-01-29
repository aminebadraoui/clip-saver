import React from 'react';
import type { Spark } from '@/utils/sparksApi';
import { useSparkStore } from '@/stores/useSparkStore';
import { Pencil, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PromoteSparkModal } from './PromoteSparkModal';

interface SparkCardProps {
    spark: Spark;
    onDelete?: (id: string) => void;
    onClick?: () => void;
}

export function SparkCard({ spark, onDelete, onClick }: SparkCardProps) {
    const { openEditor } = useSparkStore();

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) onClick();
        else openEditor(spark);
    };

    const [showPromote, setShowPromote] = React.useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(spark.id);
    };

    return (
        <>
            <div
                className="break-inside-avoid mb-4 group relative cursor-pointer rounded-xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-all duration-300 p-5 flex flex-col gap-3 shadow-lg hover:shadow-xl hover:shadow-primary/5"
                onClick={handleClick}
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h3 className="font-sans text-lg font-medium text-foreground/90 line-clamp-1 group-hover:text-primary transition-colors">
                        {spark.title || 'Untitled Spark'}
                    </h3>
                </div>

                {/* Content Preview */}
                <div
                    className="text-sm text-muted-foreground line-clamp-6 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2"
                    dangerouslySetInnerHTML={{ __html: spark.content }}
                />

                {/* Hover Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditor(spark);
                        }}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>

                <div className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
                    {new Date(spark.createdAt).toLocaleDateString()}
                </div>

                {/* Footer Action */}
                <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPromote(true);
                        }}
                    >
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        Promote
                    </Button>
                </div>
            </div>

            <PromoteSparkModal
                spark={spark}
                isOpen={showPromote}
                onClose={() => setShowPromote(false)}
                onPromoted={() => onDelete?.(spark.id)} // Functionally remove from list if processed, or just let page refresh handle it
            />
        </>
    );
}
