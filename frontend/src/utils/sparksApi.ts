import { API_URL } from '../config';
import { getHeaders } from './storage';

export interface Spark {
    id: string;
    content: string;
    title?: string;
    status: 'inbox' | 'processed' | 'archived';
    createdAt: number;
    updatedAt: number;
    user_id: string;
    space_id: string;
}

export const sparksApi = {
    create: async (content: string, title?: string, status: string = 'inbox'): Promise<Spark> => {
        const response = await fetch(`${API_URL}/api/sparks/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content, title, status }),
        });
        if (!response.ok) throw new Error('Failed to create spark');
        return response.json();
    },

    list: async (status?: string): Promise<Spark[]> => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/api/sparks/${query}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to list sparks');
        return response.json();
    },

    update: async (id: string, updates: Partial<Spark>): Promise<Spark> => {
        const response = await fetch(`${API_URL}/api/sparks/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update spark');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/sparks/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete spark');
    },

    get: async (id: string): Promise<Spark> => {
        const response = await fetch(`${API_URL}/api/sparks/${id}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to get spark');
        return response.json();
    }
};
