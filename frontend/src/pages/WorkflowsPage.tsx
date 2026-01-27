import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workflowApi, type Workflow } from '../utils/workflowApi';
import { Plus, Play, Copy, Trash2, Lock, Globe } from 'lucide-react';

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            setLoading(true);
            const data = await workflowApi.list(false);
            setWorkflows(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        try {
            await workflowApi.delete(id);
            setWorkflows(workflows.filter((w) => w.id !== id));
        } catch (err) {
            alert('Failed to delete workflow');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const duplicated = await workflowApi.duplicate(id);
            setWorkflows([duplicated, ...workflows]);
        } catch (err) {
            alert('Failed to duplicate workflow');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading workflows...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
                <div className="text-center text-red-500">
                    <p className="text-xl font-semibold">Error</p>
                    <p className="mt-2 text-gray-400">{error}</p>
                    <button
                        onClick={loadWorkflows}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-red-600 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <div className="container mx-auto px-6 py-10">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            AI Workflows
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Create and manage your AI-powered workflows
                        </p>
                    </div>
                    <Link
                        to="/workflows/new"
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_25px_-5px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        New Workflow
                    </Link>
                </div>

                {workflows.length === 0 ? (
                    <div className="text-center py-20 bg-[#1a1a1a]/50 backdrop-blur-sm rounded-2xl border border-white/5 border-dashed">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-semibold text-white mb-2">
                                No workflows yet
                            </h3>
                            <p className="text-gray-400 mb-8">
                                Create your first AI workflow to get started
                            </p>
                            <Link
                                to="/workflows/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-lg"
                            >
                                <Plus size={20} />
                                Create Workflow
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                className="group bg-[#1a1a1a]/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden"
                            >
                                <div className="p-6 relative">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                                            {workflow.name}
                                        </h3>
                                        {workflow.is_public ? (
                                            <Globe size={16} className="text-green-500 flex-shrink-0 mt-1" />
                                        ) : (
                                            <Lock size={16} className="text-gray-500 flex-shrink-0 mt-1" />
                                        )}
                                    </div>

                                    {workflow.description && (
                                        <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-10">
                                            {workflow.description}
                                        </p>
                                    )}

                                    <div className="text-xs text-gray-600 mb-4 font-mono">
                                        UPDATED {new Date(workflow.updated_at).toLocaleDateString().toUpperCase()}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/workflows/${workflow.id}/execute`}
                                            className="flex-1 px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-primary hover:text-white transition-all border border-white/5 hover:border-primary/50 flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Play size={16} className="fill-current group-hover/btn:fill-white transition-colors" />
                                            Run
                                        </Link>
                                        <Link
                                            to={`/workflows/${workflow.id}/edit`}
                                            className="px-3 py-2 bg-white/5 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-all border border-white/5"
                                            title="Edit"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDuplicate(workflow.id)}
                                            className="px-3 py-2 bg-white/5 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-all border border-white/5"
                                            title="Duplicate"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(workflow.id)}
                                            className="px-3 py-2 bg-white/5 text-gray-400 hover:text-red-500 text-sm rounded-lg hover:bg-red-500/10 transition-all border border-white/5 hover:border-red-500/20"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
