import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    BackgroundVariant,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    ReactFlowProvider,
    type ReactFlowInstance,
    type NodeTypes,
    MiniMap,
    Panel,
    useViewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowApi } from '../utils/workflowApi';
import { Save, Play, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { WorkflowContext } from '../context/WorkflowContext';

// Custom Nodes
import { InputNode } from '../components/workflow/InputNode';
import { ReplicateNode } from '../components/workflow/ReplicateNode';
import { OutputNode } from '../components/workflow/OutputNode';
import { NodeLibrary } from '../components/workflow/NodeLibrary';
import { NodeSettingsPanel } from '../components/workflow/NodeSettingsPanel';
import { ConcatNode } from '../components/workflow/ConcatNode';
import { RemoveBackgroundNode } from '../components/workflow/RemoveBackgroundNode';
import { InpaintNode } from '../components/workflow/InpaintNode';
import { MaskEditorNode } from '../components/workflow/MaskEditorNode';
import { LLMNode } from '../components/workflow/LLMNode';
import { MediaInputNode } from '../components/workflow/MediaInputNode';
import { MediaPickerModal } from '../components/workflow/MediaPickerModal';
import { NodeDetailModal } from '../components/workflow/NodeDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type { WorkflowTemplate } from '../components/workflow/workflowTemplates';

import { VideoIdeationNode } from '../components/workflow/VideoIdeationNode';

// Node types registry
const nodeTypes: NodeTypes = {
    input: InputNode,
    replicate: ReplicateNode,
    output: OutputNode,
    concat: ConcatNode,
    remove_bg: RemoveBackgroundNode,
    inpaint: InpaintNode,
    mask_editor: MaskEditorNode,
    llm_model: LLMNode,
    media_input: MediaInputNode,
    ideation_source: VideoIdeationNode,
};

function ZoomIndicator() {
    const { zoom } = useViewport();
    return (
        <div className="bg-[#1a1a1a]/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-400">
            {Math.round(zoom * 100)}%
        </div>
    );
}

function WorkflowEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [workflowName, setWorkflowName] = useState('Untitled Workflow');
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [showNodeLibrary, setShowNodeLibrary] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Media Picker State
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null);
    const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);

    // Detail Modal State
    const [detailModalState, setDetailModalState] = useState<{
        isOpen: boolean;
        title: string;
        content: string;
        type: 'text' | 'image';
    }>({
        isOpen: false,
        title: '',
        content: '',
        type: 'text'
    });

    const openSettings = useCallback((nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
            setSelectedNode(node);
        }
    }, [nodes]);

    const handleNodeChange = (nodeId: string, newData: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                const updatedNode = { ...node, data: newData };
                if (selectedNode?.id === nodeId) {
                    setSelectedNode(updatedNode);
                }
                return updatedNode;
            }
            return node;
        }));
    };

    // Load workflow if editing
    useEffect(() => {
        if (id && id !== 'new') {
            loadWorkflow(id);
        } else {
            // Initial state for new workflow
            setNodes([
                {
                    id: 'start-1',
                    type: 'input',
                    position: { x: 100, y: 100 },
                    data: { value: '' },
                },
            ]);
        }
    }, [id]);

    const loadWorkflow = async (workflowId: string) => {
        try {
            const workflow = await workflowApi.get(workflowId);
            setWorkflowName(workflow.name);
            if (workflow.space_id) {
                setCurrentSpaceId(workflow.space_id);
            }

            const data = JSON.parse(workflow.workflow_data);
            if (data.nodes) setNodes(data.nodes);
            if (data.edges) setEdges(data.edges);
        } catch (error) {
            console.error('Failed to load workflow:', error);
            toast.error('Failed to load workflow');
        }
    };

    const onNodesChange = useCallback(
        (changes: NodeChange[]) =>
            setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) =>
            setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        []
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) {
                return;
            }

            const type = event.dataTransfer.getData('application/reactflow');
            const dataStr = event.dataTransfer.getData('application/reactflow/data');

            if (!type) {
                console.warn("onDrop: No type found in dataTransfer");
                return;
            }

            let data = {};
            try {
                if (dataStr) {
                    data = JSON.parse(dataStr);
                }
            } catch (e) {
                console.error("onDrop: Failed to parse dataStr", dataStr, e);
                toast.error("Failed to add node: invalid data");
                return;
            }

            if (type === 'llm_model' && !(data as any)['definitionId']) {
                console.warn("onDrop: llm_model dropped but missing definitionId", data);
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: uuidv4(),
                type,
                position,
                data: { ...data },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance]
    );

    const handleAddNode = useCallback((type: string, data: any) => {
        if (!reactFlowInstance) return;

        const zoom = reactFlowInstance.getZoom();
        const { x: vX, y: vY } = reactFlowInstance.getViewport();

        const centerX = -vX / zoom + (window.innerWidth / 2) / zoom;
        const centerY = -vY / zoom + (window.innerHeight / 2) / zoom;

        const newNode: Node = {
            id: uuidv4(),
            type,
            position: { x: centerX - 100, y: centerY - 50 },
            data: { ...data },
        };

        setNodes((nds) => nds.concat(newNode));
        toast.success(`Added ${type} node`);
    }, [reactFlowInstance]);

    const handleLoadTemplate = useCallback((template: WorkflowTemplate) => {
        const idMap = new Map<string, string>();

        const newNodes = template.nodes.map(node => {
            const newId = uuidv4();
            idMap.set(node.id, newId);
            return {
                ...node,
                id: newId,
            };
        });

        const newEdges = template.edges.map(edge => ({
            ...edge,
            id: uuidv4(),
            source: idMap.get(edge.source) || edge.source,
            target: idMap.get(edge.target) || edge.target,
        }));

        setNodes((nds) => {
            return nds.concat(newNodes);
        });
        setEdges((eds) => eds.concat(newEdges));

        toast.success(`Loaded "${template.label}" template`);
        setShowNodeLibrary(false);
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            const workflowData = JSON.stringify({ nodes, edges });

            if (id && id !== 'new') {
                await workflowApi.update(id, {
                    name: workflowName,
                    workflow_data: workflowData,
                });
                toast.success('Workflow saved successfully!');
            } else {
                const newWorkflow = await workflowApi.create({
                    name: workflowName,
                    workflow_data: workflowData,
                });
                toast.success('Workflow created!');
                navigate(`/workflows/${newWorkflow.id}/edit`);
            }
        } catch (error) {
            console.error('Failed to save workflow:', error);
            toast.error('Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleExecute = async (runSelected = false) => {
        let currentId = id;

        try {
            setSaving(true);
            const workflowData = JSON.stringify({ nodes, edges });

            if (!currentId || currentId === 'new') {
                const newWorkflow = await workflowApi.create({
                    name: workflowName,
                    workflow_data: workflowData,
                });
                currentId = newWorkflow.id;
                navigate(`/workflows/${newWorkflow.id}/edit`, { replace: true });
                toast.success('Workflow saved automatically');
            } else {
                await workflowApi.update(currentId, {
                    name: workflowName,
                    workflow_data: workflowData,
                });
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
            toast.error('Failed to save workflow before execution');
            setSaving(false);
            return;
        } finally {
            setSaving(false);
        }

        if (!currentId || currentId === 'new') return;

        try {
            setExecuting(true);
            const executionId = currentId;

            setNodes((nds) => nds.map(node => {
                if (targetNodeIds && !targetNodeIds.includes(node.id)) {
                    return node;
                }
                if (!targetNodeIds && (node.type === 'input' || node.type === 'note')) {
                    return node;
                }
                return {
                    ...node,
                    data: {
                        ...node.data,
                        loading: true,
                        output: null,
                        error: null
                    }
                };
            }));

            const inputData: Record<string, any> = {};
            nodes.forEach(node => {
                if (node.type === 'input') {
                    inputData[node.id] = node.data.value;
                }
            });

            let targetNodeIds: string[] | undefined = undefined;
            if (Array.isArray(runSelected)) {
                targetNodeIds = runSelected;
                toast.info(`Running specified node...`);
            } else if (runSelected === true) {
                const selectedNodes = nodes.filter(n => n.selected);
                if (selectedNodes.length === 0) {
                    toast.info("No nodes selected, running all...");
                } else {
                    targetNodeIds = selectedNodes.map(n => n.id);
                    toast.info(`Running ${targetNodeIds.length} selected nodes...`);
                }
            }

            const execution = await workflowApi.execute(executionId, inputData, targetNodeIds);
            toast.info('Workflow execution started...');

            const eventSource = workflowApi.streamExecution(
                execution.id,
                (data) => {
                    if (data.status === 'running') {
                    }

                    if (data.error_message) {
                        toast.error(`Execution failed: ${data.error_message}`);
                        setNodes((nds) => nds.map(node => ({
                            ...node,
                            data: { ...node.data, loading: false }
                        })));
                        setExecuting(false);
                    }

                    if (data.outputs) {
                        toast.success('Execution completed!');
                        setNodes((nds) => nds.map(node => {
                            if (data.outputs && data.outputs[node.id] !== undefined) {
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        loading: false,
                                        output: data.outputs[node.id]
                                    }
                                };
                            }
                            if (node.data.loading) {
                                return { ...node, data: { ...node.data, loading: false } };
                            }
                            return node;
                        }));
                        setExecuting(false);
                        eventSource.close();
                    }
                },
                (err) => {
                    console.error('SSE Error', err);
                    setExecuting(false);
                }
            );

        } catch (error) {
            console.error('Execution failed:', error);
            toast.error('Failed to start execution');
            setExecuting(false);
            setNodes((nds) => nds.map(node => ({
                ...node,
                data: { ...node.data, loading: false }
            })));
        }
    };

    const runNode = useCallback((nodeId: string) => {
        handleExecute([nodeId] as any);
    }, [handleExecute]);

    const openMediaPicker = useCallback((onSelect: (url: string) => void) => {
        setMediaPickerCallback(() => onSelect);
        setShowMediaPicker(true);
    }, []);

    const openDetailModal = useCallback((title: string, content: string, type: 'text' | 'image') => {
        setDetailModalState({
            isOpen: true,
            title,
            content,
            type
        });
    }, []);

    const deleteNode = useCallback((nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    }, [setNodes, setEdges]);

    const clearCanvas = useCallback(() => {
        setShowClearConfirm(true);
    }, []);

    const handleConfirmClear = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setShowClearConfirm(false);
        toast.success('Canvas cleared');
    }, [setNodes, setEdges]);

    return (
        <WorkflowContext.Provider value={{ openSettings, runNode, openMediaPicker, openDetailModal, deleteNode }}>
            <div className="h-full flex flex-col bg-[#0f0f0f] overflow-hidden">
                <div className="z-40 px-6 py-4 bg-[#0f0f0f] border-b border-white/5 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/workflows')}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <input
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                className="text-lg font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none focus:ring-0 p-0 text-white placeholder:text-gray-600 transition-all"
                                placeholder="Name your workflow..."
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${saving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                                    {saving ? 'Syncing...' : id === 'new' ? 'Draft' : 'Saved'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowNodeLibrary(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all text-xs font-semibold uppercase tracking-wider mr-4"
                        >
                            <Plus size={14} />
                            Add Nodes
                        </button>

                        <button
                            onClick={clearCanvas}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-xs font-semibold uppercase tracking-wider mr-2"
                            title="Delete All Nodes"
                        >
                            <Trash2 size={14} />
                            Clear
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving || executing}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                            <Save size={14} />
                            Save
                        </button>

                        <div className="h-6 w-px bg-white/10" />

                        <button
                            onClick={() => handleExecute(true)}
                            disabled={executing || id === 'new'}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-all"
                            title="Run only selected nodes"
                        >
                            <Play size={14} className="fill-gray-300" />
                            Run Selected
                        </button>

                        <button
                            onClick={() => handleExecute(false)}
                            disabled={executing || id === 'new'}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] transition-all min-w-[120px] justify-center"
                        >
                            {executing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} className="fill-current" />}
                            {executing ? 'Running...' : 'Run Flow'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    <NodeLibrary
                        isOpen={showNodeLibrary}
                        onClose={() => setShowNodeLibrary(false)}
                        onNodeClick={handleAddNode}
                        onTemplateClick={handleLoadTemplate}
                    />

                    <NodeSettingsPanel
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                        onChange={handleNodeChange}
                    />

                    <MediaPickerModal
                        isOpen={showMediaPicker}
                        onClose={() => setShowMediaPicker(false)}
                        onSelect={(url) => {
                            if (mediaPickerCallback) mediaPickerCallback(url);
                        }}
                        token={localStorage.getItem('clipcoba_token') || ''}
                        spaceId={currentSpaceId}
                    />

                    <NodeDetailModal
                        isOpen={detailModalState.isOpen}
                        onClose={() => setDetailModalState(prev => ({ ...prev, isOpen: false }))}
                        title={detailModalState.title}
                        content={detailModalState.content}
                        type={detailModalState.type}
                    />

                    <ConfirmModal
                        isOpen={showClearConfirm}
                        onClose={() => setShowClearConfirm(false)}
                        onConfirm={handleConfirmClear}
                        title="Clear Workflow"
                        description="Are you sure you want to delete all nodes and edges? This action cannot be undone."
                        confirmText="Clear Canvas"
                        cancelText="Cancel"
                        variant="danger"
                    />

                    <div className="flex-1 h-full relative bg-[#0f0f0f]" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            nodeTypes={nodeTypes}
                            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                            minZoom={0.1}
                            maxZoom={2}
                            zoomOnScroll={false}
                            panOnScroll={true}
                            proOptions={{ hideAttribution: true }}
                            defaultEdgeOptions={{
                                type: 'default',
                                animated: true,
                                style: { stroke: '#71717a', strokeWidth: 2 }, // zinc-500 (lighter than before for visibility)
                            }}
                            connectionLineStyle={{ stroke: '#ef4444', strokeWidth: 2 }} // red-500
                            className="bg-[#0f0f0f]"
                        >
                            <Controls position="bottom-left" className="!bg-[#1a1a1a]/80 !backdrop-blur !border-white/5 !fill-zinc-400 [&>button]:!border-white/5 [&>button:hover]:!bg-white/5 !ml-8 !mb-8 !rounded-xl !shadow-xl" />
                            <MiniMap
                                position="bottom-right"
                                className="!bg-[#1a1a1a]/80 !backdrop-blur !border !border-white/5 !rounded-xl !mb-8 !mr-8 !shadow-xl"
                                maskColor="#0f0f0f"
                                nodeColor={(n) => {
                                    if (n.type === 'input') return '#52525b'; // zinc-600
                                    if (n.type === 'output') return '#52525b';
                                    return '#b91c1c'; // red-700
                                }}
                            />
                            <Panel position="bottom-left" className="!mb-8 !ml-20">
                                <ZoomIndicator />
                            </Panel>
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={24}
                                size={1}
                                color="rgba(255, 255, 255, 0.05)"
                                className="bg-[#0f0f0f]"
                            />
                        </ReactFlow>
                    </div>
                </div>
            </div>
        </WorkflowContext.Provider>
    );
}

export default function WorkflowEditorPage() {
    return (
        <ReactFlowProvider>
            <WorkflowEditor />
        </ReactFlowProvider>
    );
}
