import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Cloud, Loader2 } from 'lucide-react';
import { useSparkStore } from '../../stores/useSparkStore';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { RichSparkEditor } from './RichSparkEditor';

export function ZenSparkEditor({ isPage = false, onClose }: { isPage?: boolean; onClose?: () => void }) {
    const { isOpen, currentSpark, closeEditor, saveSpark, isSaving, createNewSpark } = useSparkStore();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // If used as a page, we might rely on props or initial load, but for now we sync with store
    // actually, if isPage is true, we should probably ignore isOpen check?
    // And "close" means navigate away.

    useEffect(() => {
        // If it's a page, we don't care about isOpen, we care if we have a spark to edit (or new)
        // Ensure content is synced when currentSpark changes
        if (currentSpark) {
            setContent(currentSpark.content || '');
            setTitle(currentSpark.title || '');
        } else if (isPage) {
            // Maybe we are initializing?
        }
    }, [currentSpark, isPage]);

    // Autosave Logic
    const handleContentChange = (newContent: string) => {
        setContent(newContent);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            saveSpark(newContent, title);
        }, 2000); // Autosave after 2s inactivity
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveSpark(content, newTitle);
        }, 2000);
    };

    const handleManualSave = () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveSpark(content, title);
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            closeEditor();
        }
    };

    // If global overlay mode (not isPage) and not open, return null
    if (!isPage && !isOpen) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[100] bg-[#0A0A0A] text-gray-200 flex flex-col items-center animate-in fade-in duration-300",
            isPage ? "relative h-full w-full inset-auto z-auto" : "" // Adjust styles if isPage
        )}>
            {/* Minimalist Header (Shows on hover or active) */}
            <div className="w-full max-w-4xl p-6 flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        {isSaving ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                        ) : (
                            <><Cloud className="w-3 h-3" /> Saved</>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleManualSave}
                        className="text-gray-500 hover:text-white"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Now
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 w-full max-w-3xl flex flex-col py-10 px-6 overflow-y-auto no-scrollbar">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled Spark..."
                    className="bg-transparent border-none text-4xl font-light text-white/90 placeholder:text-white/20 focus:ring-0 focus:outline-none mb-8 w-full font-serif"
                />

                <RichSparkEditor
                    content={content}
                    onChange={handleContentChange}
                />
            </div>

            <div className="p-4 text-xs text-gray-600 flex gap-4">
                <span>Type freely.</span>
                <span>Type <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono text-[10px]">/</kbd> for commands</span>
            </div>
        </div>
    );
}
