/**
 * API client for Replicate model catalog
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ReplicateModel {
    id: string;
    model_id: string;
    model_name: string;
    description: string;
    category: string;
    cost_per_run: number;
    is_active: boolean;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

export const replicateApi = {
    // List available models
    async listModels(category?: string): Promise<ReplicateModel[]> {
        const url = category
            ? `${API_BASE_URL}/api/replicate/models?category=${category}`
            : `${API_BASE_URL}/api/replicate/models`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch models');
        return response.json();
    },

    // Get model details
    async getModel(modelId: string): Promise<ReplicateModel> {
        const response = await fetch(
            `${API_BASE_URL}/api/replicate/models/${modelId}`,
            {
                headers: getAuthHeaders(),
            }
        );
        if (!response.ok) throw new Error('Failed to fetch model');
        return response.json();
    },

    // Refresh model cache (admin)
    async refreshModels(): Promise<void> {
        const response = await fetch(
            `${API_BASE_URL}/api/replicate/models/refresh`,
            {
                method: 'POST',
                headers: getAuthHeaders(),
            }
        );
        if (!response.ok) throw new Error('Failed to refresh models');
    },
};
