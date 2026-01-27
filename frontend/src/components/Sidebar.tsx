import { Button } from "@/components/ui/button";
import { Video, Wand2, Lightbulb, Image, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { SpaceSwitcher } from "@/components/SpaceSwitcher";

// interface SidebarProps {} // Removed as no props are needed

function LogoutButton() {
    const { logout } = useAuth();
    return (
        <Button
            variant="ghost"
            className="w-full justify-start px-2 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={logout}
        >
            <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Logout</span>
        </Button>
    );
}

export function Sidebar() {
    const location = useLocation();

    return (
        <div className="w-16 hover:w-64 transition-all duration-300 border-r bg-[#0f0f0f] h-full flex flex-col gap-4 p-4 overflow-y-auto overflow-x-hidden group z-50 shadow-2xl">
            {/* Header: Logo & Spaces */}
            <div className="flex flex-col gap-4 mb-2 flex-shrink-0">
                <Link to="/dashboard" className="flex items-center gap-2 px-2 min-w-fit">
                    <Logo className="h-8 w-8 text-primary flex-shrink-0" />
                    <span className="font-bold tracking-tight text-lg opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden whitespace-nowrap">ClipCoba</span>
                </Link>

                {/* Space Switcher */}
                <div className="opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto transition-all duration-300 overflow-hidden px-1">
                    <SpaceSwitcher />
                </div>
                <Separator className="bg-border/50" />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted">
                {/* Videos */}
                <Link to="/dashboard">
                    <Button
                        variant={location.pathname === '/dashboard' ? "secondary" : "ghost"}
                        className="w-full justify-start font-medium px-2"
                    >
                        <Video className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Videos</span>
                    </Button>
                </Link>

                {/* Add standard "AI Workflows" link at bottom */}
                <Separator className="my-2 bg-border/50" />

                <Link to="/ideation">
                    <Button
                        variant={location.pathname.startsWith('/ideation') ? "secondary" : "ghost"}
                        className="w-full justify-start px-2"
                    >
                        <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Video Ideation</span>
                    </Button>
                </Link>

                <Link to="/moodboards">
                    <Button
                        variant={location.pathname.startsWith('/moodboards') ? "secondary" : "ghost"}
                        className="w-full justify-start px-2"
                    >
                        <Image className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Moodboards</span>
                    </Button>
                </Link>

                <Separator className="my-2 bg-border/50" />
                <div className="px-2 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden h-4 group-hover:h-auto">
                    Libraries
                </div>

                <Link to="/library/titles">
                    <Button
                        variant={location.pathname === '/library/titles' ? "secondary" : "ghost"}
                        className="w-full justify-start px-2"
                    >
                        <span className="w-4 h-4 mr-2 flex items-center justify-center font-serif font-bold text-xs flex-shrink-0">T</span>
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Title Library</span>
                    </Button>
                </Link>
                <Link to="/library/thumbnails">
                    <Button
                        variant={location.pathname === '/library/thumbnails' ? "secondary" : "ghost"}
                        className="w-full justify-start px-2"
                    >
                        <Image className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Thumbnail Library</span>
                    </Button>
                </Link>
                <Link to="/library/scripts">
                    <Button
                        variant={location.pathname === '/library/scripts' ? "secondary" : "ghost"}
                        className="w-full justify-start px-2"
                    >
                        <span className="w-4 h-4 mr-2 flex items-center justify-center font-mono text-xs flex-shrink-0">S</span>
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Script Library</span>
                    </Button>
                </Link>

                {/* AI Workflows - only available in dev/local */}
                {import.meta.env.DEV && (
                    <>
                        <Separator className="my-2 bg-border/50" />

                        <Link to="/workflows">
                            <Button
                                variant={location.pathname.startsWith('/workflows') ? "secondary" : "ghost"}
                                className="w-full justify-start px-2"
                            >
                                <Wand2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">AI Workflows</span>
                            </Button>
                        </Link>
                    </>
                )}

            </div>
            {/* Footer: Settings & Logout */}
            <div className="mt-auto flex flex-col gap-2 flex-shrink-0">
                <Separator className="my-2 bg-border/50" />
                <Link to="/settings">
                    <Button
                        variant="ghost"
                        className="w-full justify-start px-2 text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto transition-all duration-300 overflow-hidden">Settings</span>
                    </Button>
                </Link>
                <LogoutButton />
            </div>
        </div>
    );
}
