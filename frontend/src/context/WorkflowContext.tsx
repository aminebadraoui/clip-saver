import { createContext, useContext } from 'react';

interface WorkflowContextType {
    openSettings: (nodeId: string) => void;
}

export const WorkflowContext = createContext<WorkflowContextType>({
    openSettings: () => { },
});

export const useWorkflow = () => useContext(WorkflowContext);
