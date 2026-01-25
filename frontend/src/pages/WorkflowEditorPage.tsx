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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowApi } from '../utils/workflowApi';
import { Save, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Custom Nodes
import { InputNode } from '../components/workflow/InputNode';
import { ReplicateNode } from '../components/workflow/ReplicateNode';
import { OutputNode } from '../components/workflow/OutputNode';
import { Sidebar } from '../components/workflow/Sidebar';

// Node types registry
const nodeTypes: NodeTypes = {
    input: InputNode,
    replicate: ReplicateNode,
    output: OutputNode,
};

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

            if (!type) return;

            const data = dataStr ? JSON.parse(dataStr) : {};

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

    const handleExecute = async () => {
        if (!id || id === 'new') {
            toast.error('Please save the workflow before executing');
            return;
        }

        try {
            setExecuting(true);

            // 1. Reset output nodes
            setNodes((nds) => nds.map(node => {
                if (node.type === 'output') {
                    return { ...node, data: { ...node.data, loading: true, output: null } };
                }
                return node;
            }));

            // 2. Identify input nodes data
            const inputData: Record<string, any> = {};
            nodes.forEach(node => {
                if (node.type === 'input') {
                    inputData[node.id] = node.data.value;
                }
            });

            // 3. Start execution
            const execution = await workflowApi.execute(id, inputData);
            toast.info('Workflow execution started...');

            // 4. Poll or Stream for updates
            // Using SSE
            const eventSource = workflowApi.streamExecution(
                execution.id,
                (data) => {
                    if (data.status === 'running') {
                        // Maybe update specific node progress if available
                    }

                    if (data.error_message) {
                        toast.error(`Execution failed: ${data.error_message}`);
                        setNodes((nds) => nds.map(node => {
                            if (node.type === 'output') {
                                return { ...node, data: { ...node.data, loading: false } };
                            }
                            return node;
                        }));
                        setExecuting(false);
                    }

                    if (data.outputs) {
                        // Execution completed
                        toast.success('Execution completed!');

                        // Update output nodes with results
                        setNodes((nds) => nds.map(node => {
                            if (node.type === 'output') {
                                // Find output for this node ID if mapped, or just generic 'output'
                                // The backend engine maps outputs by node ID if specified
                                const nodeOutput = data.outputs[node.id] || data.outputs['output'];
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        loading: false,
                                        output: nodeOutput
                                    }
                                };
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
            setNodes((nds) => nds.map(node => {
                if (node.type === 'output') {
                    return { ...node, data: { ...node.data, loading: false } };
                }
                return node;
            }));
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/workflows')}
                        className="p-2 hover:bg-gray-100 rounded text-gray-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            className="text-lg font-semibold border-none focus:outline-none focus:ring-0 p-0"
                            placeholder="Workflow Name"
                        />
                        <span className="text-xs text-gray-500">
                            {saving ? 'Saving...' : id === 'new' ? 'Unsaved' : 'Saved'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving || executing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                    >
                        <Save size={16} />
                        Save
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={executing || id === 'new'}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium min-w-[100px] justify-center"
                    >
                        {executing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                        {executing ? 'Running' : 'Run Flow'}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />

                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
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
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Controls />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

export default function WorkflowEditorPage() {
    return (
        <ReactFlowProvider>
            <WorkflowEditor />
        </ReactFlowProvider>
    );
}
