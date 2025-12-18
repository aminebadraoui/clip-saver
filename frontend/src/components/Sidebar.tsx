import { Button } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";


interface SidebarProps {
    onSelectTag: (id: string | null) => void;
    onSelectFilterType: (type: 'all' | 'video' | 'clip') => void;
}

export function Sidebar({
    onSelectTag,
    onSelectFilterType,
}: SidebarProps) {
    const location = useLocation();
    const isIdeation = location.pathname.startsWith('/ideation');

    return (
        <div className="w-64 border-r bg-muted/10 h-full flex flex-col gap-6 p-4 overflow-y-auto">
            <div className="space-y-2">
                <Link to="/dashboard">
                    <Button
                        variant={location.pathname.startsWith('/dashboard') ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                            onSelectFilterType('video');
                            onSelectTag(null);
                        }}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Button>
                </Link>

                <Link to="/ideation">
                    <Button
                        variant={isIdeation ? "secondary" : "ghost"}
                        className="w-full justify-start"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Video Ideation
                    </Button>
                </Link>
            </div>


        </div>
    );
}
