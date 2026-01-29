import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand, getSuggestionItems, renderSuggestionItems } from '../editor/extensions/SlashCommand';
import { AudioExtension } from '../editor/extensions/AudioExtension';
import { cn } from '@/lib/utils';
import './RichSparkEditor.css'; // We'll create this minimal CSS

interface RichSparkEditorProps {
    content: string;
    onChange: (content: string) => void; // We'll pass HTML back
    isEditable?: boolean;
}

export const RichSparkEditor: React.FC<RichSparkEditorProps> = ({ content, onChange, isEditable = true }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Type \'/\' for commands...',
            }),
            AudioExtension,
            SlashCommand.configure({
                suggestion: {
                    items: getSuggestionItems,
                    render: renderSuggestionItems,
                },
            }),
        ],
        content: content,
        editable: isEditable,
        onUpdate: ({ editor }) => {
            // We'll store HTML for now as it handles custom nodes better than markdown
            // But if we need markdown we could use a transformer
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px]',
            },
        },
    });

    // Update content if changed externally (be careful of loops)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Simple check, might need better diffing if real-time
            // For now, only set if empty to avoid cursor jumps
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="w-full">
            <EditorContent editor={editor} />
        </div>
    );
};
