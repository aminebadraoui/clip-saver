import type { ViralVideo } from "@/types/youtube";
import { ExternalLink, Eye, Users, TrendingUp } from "lucide-react";

interface ViralVideoCardProps {
    video: ViralVideo;
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

function getViralRatioColor(ratio: number): string {
    if (ratio >= 1.0) return "from-purple-500 to-pink-500";
    if (ratio >= 0.5) return "from-blue-500 to-purple-500";
    if (ratio >= 0.1) return "from-green-500 to-blue-500";
    return "from-gray-500 to-gray-600";
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

export function ViralVideoCard({ video }: ViralVideoCardProps) {
    const viralRatioColor = getViralRatioColor(video.viralRatio);

    return (
        <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Viral Ratio Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full bg-gradient-to-r ${viralRatioColor} text-white font-bold text-sm shadow-lg flex items-center gap-1`}>
                    <TrendingUp className="w-4 h-4" />
                    {video.viralRatio.toFixed(2)}x
                </div>

                {/* External Link Icon */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ExternalLink className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                </h3>

                {/* Channel Name */}
                <p className="text-sm text-muted-foreground">{video.channelName}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(video.viewCount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(video.subscriberCount)}</span>
                    </div>
                    <span>•</span>
                    <span>{formatDate(video.publishedAt)}</span>
                </div>
            </div>
        </a>
    );
}
