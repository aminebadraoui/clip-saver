/**
 * API client for credit management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CreditBalance {
    balance: number;
    user_id: string;
}

export interface CreditTransaction {
    id: string;
    amount: number;
    transaction_type: string;
    description: string;
    created_at: number;
}

export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    bonus_credits: number;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

export const creditsApi = {
    // Get current balance
    async getBalance(): Promise<CreditBalance> {
        const response = await fetch(`${API_BASE_URL}/api/credits/balance`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch balance');
        return response.json();
    },

    // Get transaction history
    async getTransactions(
        limit = 50,
        offset = 0
    ): Promise<CreditTransaction[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/credits/transactions?limit=${limit}&offset=${offset}`,
            {
                headers: getAuthHeaders(),
            }
        );
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    // Get pricing packages
    async getPricing(): Promise<CreditPackage[]> {
        const response = await fetch(`${API_BASE_URL}/api/credits/pricing`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch pricing');
        return response.json();
    },

    // Purchase credits
    async purchase(packageId: string): Promise<{
        success: boolean;
        credits_added: number;
        new_balance: number;
        transaction_id: string;
    }> {
        const response = await fetch(`${API_BASE_URL}/api/credits/purchase`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ package_id: packageId }),
        });
        if (!response.ok) throw new Error('Failed to purchase credits');
        return response.json();
    },
};
