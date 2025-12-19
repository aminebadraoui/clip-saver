import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { API_URL } from "@/config";


export const SettingsPage = () => {
    const { user, token, logout, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);





    useEffect(() => {
        const syncAndRefresh = async () => {
            try {
                if (token) {
                    await fetch(`${API_URL}/billing/sync`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    await refreshUser();
                }
            } catch (e) {
                console.error("Sync failed", e);
            }
        };
        syncAndRefresh();
    }, [token]);

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
                            <div className="flex flex-col">
                                <span className="font-medium capitalize">{user?.subscription_status || 'Free'}</span>
                                {user?.cancel_at_period_end && user?.current_period_end && (
                                    <span className="text-xs text-muted-foreground">
                                        Ends on {new Date(user.current_period_end * 1000).toLocaleDateString()}
                                    </span>
                                )}
                                {!user?.cancel_at_period_end && user?.subscription_status === 'active' && user?.current_period_end && (
                                    <span className="text-xs text-muted-foreground">
                                        Renews on {new Date(user.current_period_end * 1000).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
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
