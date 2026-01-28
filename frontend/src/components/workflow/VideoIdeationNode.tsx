import { useState, useEffect, useCallback } from 'react';
import { type NodeProps, useReactFlow } from 'reactflow';
import { NodeWrapper } from './NodeWrapper';
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config';
import { getHeaders } from '../../utils/storage';
import { toast } from 'sonner';

interface VideoIdeationLite {
    id: string;
    projectName: string;
    updatedAt: number;
}

// Helper to update node data immutably
const updateNodeData = (id: string, newData: any, setNodes: any) => {
    setNodes((nds: any[]) =>
        nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...newData
                    },
                };
            }
            return node;
        })
    );
};

export function VideoIdeationNode({ id, data, selected }: NodeProps) {
    const { setNodes } = useReactFlow();
    const [projects, setProjects] = useState<VideoIdeationLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(data.value?.id || '');

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ideation`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const list = await res.json();
                setProjects(list);
            } else {
                toast.error("Failed to load ideation projects");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load ideation projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pid = e.target.value;
        setSelectedProjectId(pid);

        if (!pid) {
            updateNodeData(id, { value: null, label: 'Video Ideation' }, setNodes);
            return;
        }

        // Fetch full project details to store in node data
        try {
            const res = await fetch(`${API_URL}/api/ideation/${pid}`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const project = await res.json();
                // Store the whole project in 'value' so downstream nodes can access fields
                updateNodeData(id, {
                    value: project,
                    label: `Strategy: ${project.projectName}`
                }, setNodes);
            }
        } catch (e) {
            console.error("Failed to fetch project details", e);
        }
    }, [id, setNodes]);

    return (
        <NodeWrapper
            id={id}
            selected={selected}
            title={data.label || 'Video Ideation'}
            icon={Lightbulb}
            color="bg-amber-500"
            outputs={[{ id: 'output', label: 'Strategy Package' }]}
        >
            <div className="flex flex-col gap-3 p-1">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-400">Select Project</label>
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchProjects(); }}
                        className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        {loading ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                    </button>
                </div>

                <select
                    className="w-full bg-black/20 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    value={selectedProjectId}
                    onChange={handleSelect}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="">-- Select a Strategy --</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.projectName}
                        </option>
                    ))}
                </select>

                {data.value && (
                    <div className="text-[10px] text-gray-500 bg-white/5 p-2 rounded border border-white/5 space-y-1">
                        <div><strong className="text-gray-400">Topic:</strong> {data.value.mainIdea?.slice(0, 50)}...</div>
                        <div><strong className="text-gray-400">Vibe:</strong> {data.value.visualVibe || 'N/A'}</div>
                        <div><strong className="text-gray-400">Audience:</strong> {data.value.targetAudience || 'N/A'}</div>
                    </div>
                )}
            </div>
        </NodeWrapper>
    );
}
