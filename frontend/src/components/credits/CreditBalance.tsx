import { useState, useEffect } from 'react';
import { creditsApi, type CreditBalance } from '../../utils/creditsApi';
import { Coins, AlertCircle } from 'lucide-react';

interface CreditBalanceProps {
    onPurchaseClick?: () => void;
}

export default function CreditBalanceComponent({ onPurchaseClick }: CreditBalanceProps) {
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadBalance();
    }, []);

    const loadBalance = async () => {
        try {
            setLoading(true);
            const data = await creditsApi.getBalance();
            setBalance(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load balance');
        } finally {
            setLoading(false);
        }
    };

    // Refresh balance periodically
    useEffect(() => {
        const interval = setInterval(loadBalance, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading && !balance) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <Coins size={20} className="text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-600">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <AlertCircle size={20} className="text-red-600" />
                <span className="text-sm text-red-600">Error loading credits</span>
            </div>
        );
    }

    if (!balance) return null;

    const isLow = balance.balance < 50;

    return (
        <div
            className={`flex items-center gap-3 px-4 py-2 rounded-lg ${isLow ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-100'
                }`}
        >
            <Coins
                size={20}
                className={isLow ? 'text-yellow-600' : 'text-blue-600'}
            />
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                        {balance.balance.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600">credits</span>
                </div>
                {isLow && (
                    <p className="text-xs text-yellow-700">Low balance</p>
                )}
            </div>
            {onPurchaseClick && (
                <button
                    onClick={onPurchaseClick}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                    Buy Credits
                </button>
            )}
        </div>
    );
}

// Export a hook for programmatic access
export function useCreditBalance() {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            const data = await creditsApi.getBalance();
            setBalance(data.balance);
        } catch (err) {
            console.error('Failed to load balance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { balance, loading, refresh };
}
