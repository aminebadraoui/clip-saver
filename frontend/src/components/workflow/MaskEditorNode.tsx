import { type NodeProps } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { PenTool, Eraser, Undo, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function MaskEditorNode({ id, data, selected }: NodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(20);
    const [mode, setMode] = useState<'draw' | 'erase'>('draw');
    const [history, setHistory] = useState<ImageData[]>([]);

    // Image element to draw the input image on canvas background
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

    // Initial setup
    useEffect(() => {
        data.op_type = 'mask_editor';
    }, [data]);

    // Handle Input Image
    useEffect(() => {
        if (data.image) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = data.image;
            img.onload = () => {
                setImgElement(img);
                initCanvas(img);
            };
        } else {
            // If no input image, maybe just black background?
            setImgElement(null);
            initCanvas(null);
        }
    }, [data.image]);

    const initCanvas = (img: HTMLImageElement | null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions (fixed for now or based on image?)
        // Let's use a fixed visible size but maybe scale internal resolution?
        // For simplicity, fixed 300x300 or aspect ratio of image?
        // Let's try 300 width, auto height.

        let width = 280; // matches node width roughly
        let height = 280;

        if (img) {
            const aspect = img.height / img.width;
            height = width * aspect;
        }

        canvas.width = width;
        canvas.height = height;

        // Fill black (mask background)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        // If we have an existing mask in data, load it? 
        // For now, fresh start or keep existing if node didn't unmount
    };

    // Save state for Undo
    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        if (history.length > 10) {
            setHistory(prev => [...prev.slice(1), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        } else {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const handleUndo = (e: React.MouseEvent) => {
        e.stopPropagation();
        const canvas = canvasRef.current;
        if (!canvas || history.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const lastState = history[history.length - 1];
        ctx.putImageData(lastState, 0, 0);
        setHistory(prev => prev.slice(0, -1));
        updateOutput();
    };

    const clearCanvas = (e: React.MouseEvent) => {
        e.stopPropagation();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveState();
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateOutput();
    };

    // Drawing Logic
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.stopPropagation(); // prevent node drag
        setIsDrawing(true);
        saveState();
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath(); // reset path
            updateOutput();
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate position
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = mode === 'draw' ? 'white' : 'black';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const updateOutput = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Save as Data URL to output
        data.mask_output = canvas.toDataURL('image/png');
    };

    const inputs = [
        { id: 'image', label: 'Reference Image' }
    ];

    const outputs = [
        { id: 'mask', label: 'Mask Output' }
    ];

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title="Mask Editor"
            icon={PenTool}
            color="bg-orange-500"
            inputs={inputs}
            outputs={outputs}
            className="w-[320px]"
        >
            <div className="space-y-3">
                {/* Toolbar */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-md">
                    <button
                        className={`p-1.5 rounded ${mode === 'draw' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={(e) => { e.stopPropagation(); setMode('draw'); }}
                        title="Draw (White)"
                    >
                        <PenTool size={14} />
                    </button>
                    <button
                        className={`p-1.5 rounded ${mode === 'erase' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={(e) => { e.stopPropagation(); setMode('erase'); }}
                        title="Erase (Black)"
                    >
                        <Eraser size={14} />
                    </button>

                    <div className="h-4 w-px bg-gray-300 mx-1" />

                    <button
                        className="p-1.5 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        title="Undo"
                    >
                        <Undo size={14} />
                    </button>
                    <button
                        className="p-1.5 rounded text-gray-500 hover:text-red-600 ml-auto"
                        onClick={clearCanvas}
                        title="Clear All"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Brush Size */}
                <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-gray-500 w-8">Size</span>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer nodrag"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <span className="text-[10px] text-gray-500 w-4">{brushSize}</span>
                </div>

                {/* Canvas Container */}
                <div className="relative border border-gray-300 rounded overflow-hidden bg-[url('/checker-pattern.png')] min-h-[200px] flex items-center justify-center bg-gray-900">
                    {/* Background Image (ghost) for reference */}
                    {data.image && (
                        <img
                            src={data.image}
                            className="absolute top-0 left-0 w-full h-full object-contain opacity-50 pointer-events-none select-none"
                            alt="Reference"
                        />
                    )}

                    {/* The drawing canvas (Mask) */}
                    <canvas
                        ref={canvasRef}
                        className="relative z-10 cursor-crosshair touch-none opacity-80 hover:opacity-90"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />

                    {!data.image && !imgElement && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-500 text-xs">
                            Connect Image to Start
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                    Draw white to mask.
                </p>
            </div>
        </NodeWrapper>
    );
}
