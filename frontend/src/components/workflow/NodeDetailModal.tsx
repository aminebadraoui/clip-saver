import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface NodeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string; // The text content or image URL
    type: 'text' | 'image';
}

export function NodeDetailModal({ isOpen, onClose, title, content, type }: NodeDetailModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <p className="text-sm text-gray-400">Expanded View</p>
                    </div>
                    <div className="flex gap-2">
                        {type === 'text' && (
                            <Button variant="ghost" size="icon" onClick={handleCopy} className="hover:bg-white/10 text-gray-400 hover:text-white">
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-gray-400 hover:text-white">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {type === 'image' ? (
                        <div className="flex items-center justify-center h-full">
                            <img
                                src={content}
                                alt={title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 bg-black/30 p-4 rounded-lg border border-white/5">
                            {content}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
