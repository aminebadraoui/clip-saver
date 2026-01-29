import React, { useEffect, useState } from 'react';
import { sparksApi, type Spark } from '@/utils/sparksApi';
import { useSparkStore } from '@/stores/useSparkStore';
import { useAuth } from '@/context/AuthContext';
import { SparkCard } from './SparkCard';
import { Loader2, Inbox, Archive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SparkInbox() {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isOpen } = useSparkStore(); // Listen to store changes to auto-refresh
    const { currentSpace } = useAuth(); // Refresh when space changes

    const loadSparks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await sparksApi.list('inbox');
            setSparks(data);
        } catch (error: any) {
            console.error('Failed to load inbox sparks:', error);
            setError(error.message || "Failed to load sparks");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSparks();
    }, [isOpen, currentSpace?.id]);

    const handleArchive = async (id: string) => {
        try {
            await sparksApi.update(id, { status: 'archived' });
            setSparks(prev => prev.filter(s => s.id !== id));
            toast.success('Spark archived');
        } catch (e) {
            toast.error('Failed to archive spark');
        }
    };

    if (isLoading) {
        return <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center text-red-500 bg-red-50/10 rounded-lg border border-red-200 border-dashed">
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={loadSparks} className="mt-2">
                    Retry
                </Button>
            </div>
        );
    }

    if (sparks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                <Inbox className="w-10 h-10 mb-3 opacity-50" />
                <p>No new sparks in your inbox.</p>
                <Button variant="ghost" size="sm" onClick={loadSparks} className="mt-2 text-xs">
                    <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Inbox className="w-5 h-5" />
                    Spark Inbox
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/70">
                        {sparks.length}
                    </span>
                </h2>
                <Button variant="ghost" size="icon" onClick={loadSparks} title="Refresh Inbox">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sparks.map(spark => (
                    <div key={spark.id} className="relative group">
                        <SparkCard spark={spark} />
                        {/* Quick Action Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full shadow-sm bg-background/80 hover:bg-background"
                                title="Archive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(spark.id);
                                }}
                            >
                                <Archive className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

