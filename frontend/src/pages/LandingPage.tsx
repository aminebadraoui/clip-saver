
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Shield, Zap, Sparkles, Youtube, PenTool, FolderOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="h-10 w-auto text-primary" />
                        <span className="font-bold text-xl tracking-tight">ClipCoba</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Button onClick={() => navigate('/dashboard')}>
                                Go to Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => navigate('/login')}>
                                    Log in
                                </Button>
                                <Button onClick={() => navigate('/register')}>
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="py-24 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
                    <div className="container mx-auto px-4 relative">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            <h1 className="text-4xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 leading-tight">
                                The All-in-One Video Workspace for Creators
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Snap videos, organize with tags, and turn inspiration into viral scripts with AI.
                            </p>
                            <div className="flex items-center justify-center pt-4">
                                <Button size="lg" className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all" onClick={() => navigate('/register')}>
                                    Get Started
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

                            {/* Feature 1: Snap & Save */}
                            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-6">
                                    <Youtube className="w-7 h-7 text-red-600 dark:text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Snap & Save</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Instantly save videos from specific timestamps directly from YouTube with our powerful Chrome Extension.
                                </p>
                            </div>

                            {/* Feature 2: AI Intelligence */}
                            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-6">
                                    <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">AI Intelligence</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Generate viral video ideas, titles, and detailed outlines automatically from your saved clips.
                                </p>
                            </div>

                            {/* Feature 3: Scripting */}
                            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                                    <PenTool className="w-7 h-7 text-blue-600 dark:text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Scripting</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Write, edit, and refine your video scripts directly in the app with distraction-free tools.
                                </p>
                            </div>

                            {/* Feature 4: Organization */}
                            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-6">
                                    <FolderOpen className="w-7 h-7 text-amber-600 dark:text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Organization</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Keep your creative mess tidy. Manage your library with smart tags, spaces, and intuitive search.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-12 bg-background/50">
                <div className="container mx-auto px-4 text-center text-muted-foreground text-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <p>&copy; {new Date().getFullYear()} ClipCoba. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        <button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors font-medium">
                            Privacy Policy
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};
