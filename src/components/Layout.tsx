import { Scissors, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface LayoutProps {
    children: React.ReactNode;
}

function LogoutButton() {
    const { logout } = useAuth();
    return (
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
        </Button>
    );
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            {/* Header with Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo/Title */}
                        <Link to="/" className="flex items-center gap-2 min-w-fit hover:opacity-80 transition-opacity">
                            <Scissors className="w-6 h-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight">ClipCoba</h1>
                        </Link>

                        {/* Search/Add Input */}
                        <div className="flex-1 max-w-xl mx-auto">
                            <div className="relative">
                                <Input
                                    placeholder="Paste YouTube URL to save..."
                                    className="w-full bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors pl-4 pr-10"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.trim()) {
                                                window.location.href = `/?addVideo=${encodeURIComponent(target.value.trim())}`;
                                                target.value = '';
                                            }
                                        }
                                    }}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <LogoutButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-6xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
