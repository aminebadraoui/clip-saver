/**
 * API client for workflow operations
 */

import { API_URL } from "@/config";

const API_BASE_URL = API_URL;

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  is_public: boolean;
  workflow_data: string;
  created_at: number;
  updated_at: number;
  user_id: string;
  space_id?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  credits_used: number;
  execution_time_ms?: number;
  created_at: number;
  completed_at?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('clipcoba_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const workflowApi = {
  // List workflows
  async list(includePublic = false): Promise<Workflow[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/workflows?include_public=${includePublic}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to fetch workflows');
    return response.json();
  },

  // Get workflow by ID
  async get(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch workflow');
    return response.json();
  },

  // Create workflow
  async create(data: {
    name: string;
    description?: string;
    workflow_data: string;
    is_public?: boolean;
  }): Promise<Workflow> {
    const response = await fetch(`${API_BASE_URL}/api/workflows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    return response.json();
  },

  // Update workflow
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      workflow_data?: string;
      is_public?: boolean;
      thumbnail?: string;
    }
  ): Promise<Workflow> {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update workflow');
    return response.json();
  },

  // Delete workflow
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete workflow');
  },

  // Duplicate workflow
  async duplicate(id: string): Promise<Workflow> {
    const response = await fetch(
      `${API_BASE_URL}/api/workflows/${id}/duplicate`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to duplicate workflow');
    return response.json();
  },

  // List public templates
  async listTemplates(): Promise<Workflow[]> {
    const response = await fetch(`${API_BASE_URL}/api/workflows/templates`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  // Execute workflow
  // Execute workflow
  async execute(
    id: string,
    inputData: Record<string, any>,
    targetNodeIds?: string[]
  ): Promise<WorkflowExecution> {
    const response = await fetch(
      `${API_BASE_URL}/api/workflows/${id}/execute`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ input_data: inputData, target_node_ids: targetNodeIds }),
      }
    );
    if (!response.ok) throw new Error('Failed to execute workflow');
    return response.json();
  },

  // Get execution status
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const response = await fetch(
      `${API_BASE_URL}/api/executions/${executionId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to fetch execution');
    return response.json();
  },

  // Stream execution updates (SSE)
  streamExecution(
    executionId: string,
    onUpdate: (data: any) => void,
    onError?: (error: Error) => void
  ): EventSource {
    const token = localStorage.getItem('clipcoba_token');
    const url = `${API_BASE_URL}/api/executions/${executionId}/stream?token=${token}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      if (onError) onError(new Error('Stream connection failed'));
      eventSource.close();
    };

    return eventSource;
  },

  // List executions for a workflow
  async listExecutions(
    workflowId: string,
    limit = 50,
    offset = 0
  ): Promise<WorkflowExecution[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/workflows/${workflowId}/executions?limit=${limit}&offset=${offset}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to fetch executions');
    return response.json();
  },

  // Cancel execution
  async cancelExecution(executionId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/executions/${executionId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error('Failed to cancel execution');
  },

  // Replicate Models
  async listModels(category?: string): Promise<any[]> {
    const query = category ? `?category=${category}` : '';
    const response = await fetch(`${API_BASE_URL}/api/replicate/models${query}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch replicate models');
    return response.json();
  },

  // Get Async Job status
  async getJob(jobId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch job status');
    return response.json();
  }
};
