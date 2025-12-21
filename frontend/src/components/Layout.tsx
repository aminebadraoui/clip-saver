import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { AppDataProvider, useAppData } from "@/context/AppDataContext";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Settings } from "lucide-react";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SpaceSwitcher } from "@/components/SpaceSwitcher";

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

// LayoutContent component that uses the context
function LayoutContent({ children }: { children: React.ReactNode }) {
    const {
        tags, selectedTagIds,
        handleSelectTag, setFilterType,
        refreshData, isLoading
    } = useAppData();
    const location = useLocation();
    const { isSubscribed } = useAuth();
    const showRightSidebar = (location.pathname === '/' || location.pathname === '/dashboard') && isSubscribed;

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6">
            <Sidebar
                onSelectTag={handleSelectTag}
                onSelectFilterType={setFilterType}
            />

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-8">
                    {children}
                </div>
            </div>

            {showRightSidebar && (
                <RightSidebar
                    tags={tags}
                    selectedTagIds={selectedTagIds}
                    onSelectTag={handleSelectTag}
                    onRefetchTags={refreshData}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background font-sans antialiased overflow-hidden">
            {/* Header with Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container max-w-[1920px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo/Title */}
                        <Link to="/dashboard" className="flex items-center gap-2 min-w-fit hover:opacity-80 transition-opacity">
                            <Logo className="h-8 w-auto text-primary" />
                            <h1 className="text-lg font-bold tracking-tight">ClipCoba</h1>
                        </Link>

                        <div className="hidden md:flex ml-4 border-l border-white/10 pl-4 h-8 items-center">
                            <SpaceSwitcher />
                        </div>

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
                                                window.location.href = `/dashboard?addVideo=${encodeURIComponent(target.value.trim())}`;
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

                        <Link to="/settings">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </Button>
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
                {/* Subscription Banner */}
                <SubscriptionBanner />
            </header>

            {/* Main Content with Sidebars */}
            <main className="container max-w-[1920px] mx-auto px-6 py-6 h-[calc(100vh-73px)]">
                {/* 
                   We need to ensure AppDataProvider is up the tree. 
                   Since we are modifying Layout, and Layout wraps pages, 
                   we can put the provider here, BUT it's better if it wraps everything.
                   However, existing App.tsx wraps routes with Layout.
                   To be safe and consistent, we can use the provider inside App.tsx or here.
                   Using it here allows us to access context in the same file via a child component.
                 */}
                <AppDataProvider>
                    <LayoutContent>{children}</LayoutContent>
                </AppDataProvider>
            </main>
        </div>
    );
}
