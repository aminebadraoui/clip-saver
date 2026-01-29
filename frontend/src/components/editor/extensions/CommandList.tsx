import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Mic, Type, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionProps } from '@tiptap/suggestion';

export interface CommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface Item {
    title: string;
    icon: any;
    command: (props: { editor: any; range: any }) => void;
}

export const CommandList = forwardRef<CommandListRef, any>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    return (
        <div className="z-50 min-w-[180px] bg-[#1a1a1a] rounded-lg border border-gray-800 shadow-xl overflow-hidden p-1">
            {props.items.length ? (
                props.items.map((item: Item, index: number) => (
                    <button
                        key={index}
                        className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 rounded hover:bg-white/10 transition-colors text-left",
                            index === selectedIndex && "bg-white/10 text-white"
                        )}
                        onClick={() => selectItem(index)}
                    >
                        <item.icon className="w-4 h-4 opacity-70" />
                        {item.title}
                    </button>
                ))
            ) : (
                <div className="px-2 py-1.5 text-sm text-gray-500">No results</div>
            )}
        </div>
    );
});
