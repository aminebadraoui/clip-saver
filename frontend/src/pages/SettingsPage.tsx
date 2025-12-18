import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export const SettingsPage = () => {
    const { user, token, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/billing/create-portal-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Failed to create portal session');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to open subscription management.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 mb-8">
                <h2 className="text-xl font-semibold mb-4">Account</h2>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-gray-400 text-sm">Email</label>
                        <div className="font-medium">{user?.email}</div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm">Subscription Status</label>
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${user?.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="capitalize">{user?.subscription_status || 'Inactive'}</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleManageSubscription}
                            disabled={loading}
                            variant="outline"
                            className="border-neutral-700 hover:bg-neutral-800 text-white"
                        >
                            {loading ? 'Opening Portal...' : 'Manage Subscription'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h2 className="text-xl font-semibold mb-4 text-red-500">Danger Zone</h2>
                <Button onClick={logout} variant="destructive">
                    Log Out
                </Button>
            </div>
        </div>
    );
};
