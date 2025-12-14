import { Loader2 } from "lucide-react";

interface DownloadProgressProps {
    progress: number;
    status: string;
    speed?: string;
    eta?: string;
}

export function DownloadProgress({ progress, status, speed, eta }: DownloadProgressProps) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-300">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-muted/20"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-primary transition-all duration-300 ease-out"
                        strokeLinecap="round"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                </div>
            </div>

            <div className="text-center space-y-1">
                <h3 className="font-medium text-lg capitalize">
                    {status === 'downloading' ? 'Downloading...' :
                        status === 'processing' ? 'Processing...' :
                            status === 'starting' ? 'Starting...' : status}
                </h3>

                {status === 'downloading' && (
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-4">
                        {speed && <span>{speed}</span>}
                        {eta && <span>ETA: {eta}</span>}
                    </div>
                )}

                {status === 'processing' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Finalizing video...
                    </p>
                )}
            </div>
        </div>
    );
}
