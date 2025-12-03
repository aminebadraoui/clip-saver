import { useState, useEffect } from "react";
import { fetchTrendingKeywords } from "@/utils/youtubeAPI";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface TrendingKeywordsProps {
    onKeywordClick: (keyword: string) => void;
}

export function TrendingKeywords({ onKeywordClick }: TrendingKeywordsProps) {
    const [keywords, setKeywords] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadKeywords = async () => {
            try {
                const data = await fetchTrendingKeywords();
                setKeywords(data);
            } catch (error) {
                console.error("Failed to load trending keywords", error);
            } finally {
                setLoading(false);
            }
        };

        loadKeywords();
    }, []);

    if (loading || keywords.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-medium text-muted-foreground">Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors px-3 py-1 text-sm font-normal capitalize"
                        onClick={() => onKeywordClick(keyword)}
                    >
                        {keyword}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
