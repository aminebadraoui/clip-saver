import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function SubscriptionBanner() {
    const { user } = useAuth();

    // Only show if user is canceling AND has an end date
    if (!user?.cancel_at_period_end || !user?.current_period_end) {
        return null;
    }

    const expiryDate = new Date(user.current_period_end * 1000).toLocaleDateString();

    return (
        <div className="w-full bg-red-500/10 border-b border-red-500/20 text-red-500 px-6 py-2 flex items-center justify-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>
                Your subscription ends on {expiryDate}.
                <Link to="/settings" className="underline hover:text-red-400 ml-1">
                    Manage Subscription &rarr;
                </Link>
            </span>
        </div>
    );
}
