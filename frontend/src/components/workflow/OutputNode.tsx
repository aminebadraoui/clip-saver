import type { NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export function OutputNode({ id, data, selected }: NodeProps) {
    // data.output contains the result from the execution (e.g. image URL array or string)
    // data.loading indicates if the node is processing

    const outputs = Array.isArray(data.output) ? data.output : (data.output ? [data.output] : []);
    const isLoading = data.loading;

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title="Output"
            icon={ImageIcon}
            color="bg-zinc-800"
            inputs={[{ id: 'input', label: 'Image/Video' }]}
        >
            <div className="flex flex-col items-center justify-center min-h-[140px] bg-muted/30 rounded-md border border-dashed border-muted-foreground/30 p-2">

                {isLoading ? (
                    <div className="flex flex-col items-center text-muted-foreground gap-2">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-xs">Generating...</span>
                    </div>
                ) : outputs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 w-full">
                        {outputs.map((url: string, i: number) => (
                            <div key={i} className="relative group overflow-hidden rounded-md border border-border">
                                {url.endsWith('.mp4') || url.endsWith('.webm') ? (
                                    <video src={url} controls className="w-full h-auto object-cover" />
                                ) : (
                                    <img src={url} alt={`Output ${i}`} className="w-full h-auto object-cover" />
                                )}
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Open
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground px-4">
                        <p className="text-xs">Connect a node and run execution to see results</p>
                    </div>
                )}

            </div>
        </NodeWrapper>
    );
}
