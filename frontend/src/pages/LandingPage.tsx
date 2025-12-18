

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Shield, Zap, Layout as LayoutIcon } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="h-12 w-auto text-primary" />
                        <span className="font-bold text-xl">ClipCoba</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/login')}>
                            Log in
                        </Button>
                        <Button onClick={() => navigate('/register')}>
                            Sign up
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="py-20 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />
                    <div className="container mx-auto px-4 relative">
                        <div className="max-w-3xl mx-auto text-center space-y-8">
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                Save Your Best Moments
                                <br />
                                <span className="text-primary">In One Place</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                The ultimate tool for content creators and video enthusiasts to organize,
                                track, and manage their favorite video clips effortlessly.
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <Button size="lg" className="h-12 px-8 text-lg" onClick={() => navigate('/register')}>
                                    Get Started Free
                                </Button>
                                <Button size="lg" variant="outline" className="h-12 px-8 text-lg" onClick={() => navigate('/login')}>
                                    View Demo
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Instant Capture</h3>
                                <p className="text-muted-foreground">
                                    Save clips instantly from YouTube with our browser extension. Never lose a moment again.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <LayoutIcon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Organized Library</h3>
                                <p className="text-muted-foreground">
                                    Keep your collection tidy with folders, tags, and smart categorization features.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Private & Secure</h3>
                                <p className="text-muted-foreground">
                                    Your personal video vault. Secure authentication ensures your collection stays private.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} ClipCoba. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
