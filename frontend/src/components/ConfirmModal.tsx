import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 scale-100">
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{title}</h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed ml-1">
                        {description}
                    </p>

                    <div className="flex items-center justify-end gap-3 mt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="hover:bg-white/5 text-gray-300 hover:text-white"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === 'danger' ? 'destructive' : 'default'}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
