import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSparkStore } from '../../stores/useSparkStore';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils'; // Assuming this alias exists, check imports

import { useNavigate } from 'react-router-dom';

export function SparkButton() {
    const navigate = useNavigate();

    return (
        <Button
            onClick={() => navigate('/sparks/new')}
            className={cn(
                "fixed bottom-6 right-6 z-50",
                "h-14 w-14 rounded-full shadow-2xl shadow-primary/20",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                "transition-all duration-300 hover:scale-110 active:scale-95"
            )}
            title="Create Spark"
        >
            <Sparkles className="w-6 h-6 fill-current" />
        </Button>
    );
}
