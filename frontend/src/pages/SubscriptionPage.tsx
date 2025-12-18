import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const SubscriptionPage = () => {
    const { user, token, refreshUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        // Check if coming back from success
        const sessionId = searchParams.get('session_id');
        const canceled = searchParams.get('canceled');

        if (sessionId) {
            setMessage('Subscription successful! Redirecting to dashboard...');
            if (token && user) {
                const checkAndRedirect = async () => {
                    await refreshUser();
                    // We rely on the AuthContext state update or a subsequent effect to redirect
                    // But to be safe, we can manually check or just wait
                    // Actually, simpler: refreshUser updates user. 
                    // We can have another effect watch 'user' and sessionId.
                };
                checkAndRedirect();
            }
        } else if (canceled) {
            setMessage('Order canceled -- continue to shop around and checkout when you\'re ready.');
        }
    }, [searchParams]);

    // Redirect when subscribed
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId && user?.subscription_status === 'active') {
            // Add a small delay to let the user see the success message
            const timer = setTimeout(() => {
                window.location.href = '/dashboard'; // Hard reload to ensure fresh state or navigate
                // navigate('/dashboard'); // Soft nav is better, but let's use what we have available. 
                // navigate is not imported in the logic snippet I saw, need to check imports.
                // Actually I'll use window.location.href to be 100% sure of a clean slate if needed, or better, import navigate.
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [user, searchParams]);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/billing/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Error:', error);
            setMessage('Failed to start checkout session.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
            <div className="max-w-md w-full bg-neutral-900 rounded-xl p-8 border border-neutral-800 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Unlock Full Access</h1>
                    <p className="text-gray-400">Subscribe to Clip Coba Pro to continue.</p>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-6 mb-6 border border-neutral-700">
                    <div className="flex justify-between items-baseline mb-4">
                        <span className="text-2xl font-bold">$29</span>
                        <span className="text-gray-400">/month</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Unlimited Clips
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Viral Tracker Access
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Advanced Ideation Tools
                        </li>
                    </ul>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-blue-500/10 text-blue-400 rounded text-center text-sm">
                        {message}
                    </div>
                )}

                <Button
                    onClick={handleSubscribe}
                    disabled={loading || user?.subscription_status === 'active'}
                    className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white py-6 text-lg font-semibold"
                >
                    {loading ? 'Processing...' : (user?.subscription_status === 'active' ? 'Already Subscribed' : 'Subscribe Now')}
                </Button>

                {user?.subscription_status === 'active' && (
                    <div className="mt-4 text-center">
                        <a href="/dashboard" className="text-gray-400 hover:text-white text-sm underline">Go to Dashboard</a>
                    </div>
                )}
                {/* Debug Button for Local Development */}
                {import.meta.env.DEV && (
                    <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
                        <p className="text-xs text-gray-500 mb-2">Dev Mode Only: Webhooks won't fire on localhost without CLI.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                if (!token) return;
                                try {
                                    await fetch(`${API_URL}/billing/debug-activate`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    refreshUser();
                                    setMessage("Debug activation successful!");
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                            className="text-xs text-gray-400 hover:text-white border-neutral-700 hover:bg-neutral-800"
                        >
                            Force Unlock (Simulate Webhook)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
