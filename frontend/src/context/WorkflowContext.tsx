import { createContext, useContext } from 'react';

interface WorkflowContextType {
    openSettings: (nodeId: string) => void;
    runNode: (nodeId: string) => void;
    openMediaPicker: (onSelect: (url: string) => void) => void;
    openDetailModal: (title: string, content: string, type: 'text' | 'image') => void;
    deleteNode: (nodeId: string) => void;
}

export const WorkflowContext = createContext<WorkflowContextType>({
    openSettings: () => { },
    runNode: () => { },
    openMediaPicker: () => { },
    openDetailModal: () => { },
    deleteNode: () => { },
});

export const useWorkflow = () => useContext(WorkflowContext);
