import { Link, useLocation } from "react-router-dom";
import { Scissors, TrendingUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
    children: React.ReactNode;
}

const tabs = [
    { path: "/", label: "Your Clips", icon: Scissors },
    { path: "/viral-tracker", label: "Viral Tracker", icon: TrendingUp },
];

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
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            {/* Header with Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-4 w-full">
                            {/* Logo/Title */}
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Scissors className="w-6 h-6 text-primary" />
                                    <h1 className="text-2xl font-bold tracking-tight">Clip Saver</h1>
                                </div>
                                <LogoutButton />
                            </div>

                            {/* Tab Navigation */}
                            <nav className="flex gap-1 overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = location.pathname === tab.path;

                                    return (
                                        <Link
                                            key={tab.path}
                                            to={tab.path}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
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
