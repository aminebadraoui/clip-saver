import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AudioRecorderNode } from './AudioRecorderNode';

export const AudioExtension = Node.create({
    name: 'audioRecorder',

    group: 'block',

    atom: true,

    // It's editable in the sense that we interact with it, but content is not text
    selectable: true,
    draggable: true,

    parseHTML() {
        return [
            {
                tag: 'audio-recorder',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['audio-recorder', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(AudioRecorderNode);
    },
});
