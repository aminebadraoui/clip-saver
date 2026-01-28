import { useLocation } from "react-router-dom";
import { AppDataProvider } from "@/context/AppDataContext";
import { Sidebar } from "@/components/Sidebar";


// Actually LogoutButton component was removed in previous step? No, I need to remove it now.


interface LayoutProps {
    children: React.ReactNode;
}



// LayoutContent component that uses the context
function LayoutContent({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const isWorkflowEditor = location.pathname.includes('/workflows/') && (location.pathname.endsWith('/new') || location.pathname.endsWith('/edit') || location.pathname.endsWith('/execute'));

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar />

            <main className={`flex-1 flex flex-col min-w-0 bg-background ${isWorkflowEditor ? 'p-0' : ''}`}>
                {/* Scrollable Content Area */}
                <div className={`flex-1 ${isWorkflowEditor ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
                    <div className={isWorkflowEditor ? 'h-full' : 'container mx-auto space-y-8'}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="h-screen w-full bg-background font-sans antialiased overflow-hidden">
            {/* We removed the header and unified the layout */}
            <AppDataProvider>
                <LayoutContent>{children}</LayoutContent>
            </AppDataProvider>
        </div>
    );
}
