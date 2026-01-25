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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading workflows...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-red-600">
                    <p className="text-xl font-semibold">Error</p>
                    <p className="mt-2">{error}</p>
                    <button
                        onClick={loadWorkflows}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Workflows</h1>
                    <p className="text-gray-600 mt-2">
                        Create and manage your AI-powered workflows
                    </p>
                </div>
                <Link
                    to="/workflows/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    New Workflow
                </Link>
            </div>

            {workflows.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No workflows yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Create your first AI workflow to get started
                        </p>
                        <Link
                            to="/workflows/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
                            className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden"
                        >
                            {workflow.thumbnail ? (
                                <img
                                    src={workflow.thumbnail}
                                    alt={workflow.name}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white text-6xl font-bold opacity-20">
                                        {workflow.name.charAt(0)}
                                    </span>
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                                        {workflow.name}
                                    </h3>
                                    {workflow.is_public ? (
                                        <Globe size={16} className="text-green-600 flex-shrink-0" />
                                    ) : (
                                        <Lock size={16} className="text-gray-400 flex-shrink-0" />
                                    )}
                                </div>

                                {workflow.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {workflow.description}
                                    </p>
                                )}

                                <div className="text-xs text-gray-500 mb-4">
                                    Updated {new Date(workflow.updated_at).toLocaleDateString()}
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        to={`/workflows/${workflow.id}/edit`}
                                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition text-center"
                                    >
                                        Edit
                                    </Link>
                                    <Link
                                        to={`/workflows/${workflow.id}/execute`}
                                        className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                                    >
                                        <Play size={16} />
                                    </Link>
                                    <button
                                        onClick={() => handleDuplicate(workflow.id)}
                                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(workflow.id)}
                                        className="px-3 py-2 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition"
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
    );
}
