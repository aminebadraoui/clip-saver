import { Type, Image as ImageIcon, Cpu } from 'lucide-react';

export function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 border-l bg-white flex flex-col h-full shadow-lg z-10">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Tools</h2>
                <p className="text-xs text-muted-foreground">Drag nodes to the canvas</p>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto flex-1">

                {/* Basic Nodes */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inputs</h3>

                    <div
                        className="flex items-center gap-3 p-3 rounded-md border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-grab transition-all"
                        onDragStart={(event) => onDragStart(event, 'input', { label: 'Input Node' })}
                        draggable
                    >
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-md">
                            <Type size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Text Input</span>
                            <span className="text-[10px] text-gray-500">Provide prompt/text</span>
                        </div>
                    </div>
                </div>

                {/* Replicate Nodes */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Models</h3>

                    <div
                        className="flex items-center gap-3 p-3 rounded-md border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 cursor-grab transition-all"
                        onDragStart={(event) => onDragStart(event, 'replicate', { model_id: '' })}
                        draggable
                    >
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                            <Cpu size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Replicate Model</span>
                            <span className="text-[10px] text-gray-500">Gen AI / Transformations</span>
                        </div>
                    </div>
                </div>

                {/* Output Nodes */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outputs</h3>

                    <div
                        className="flex items-center gap-3 p-3 rounded-md border border-dashed border-gray-300 hover:border-rose-500 hover:bg-rose-50 cursor-grab transition-all"
                        onDragStart={(event) => onDragStart(event, 'output', {})}
                        draggable
                    >
                        <div className="p-2 bg-rose-100 text-rose-700 rounded-md">
                            <ImageIcon size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Result Viewer</span>
                            <span className="text-[10px] text-gray-500">View images/videos</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
