
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Sparkles, Youtube, PenTool, FolderOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="h-8 w-auto text-primary" />
                        <span className="font-bold text-lg tracking-tight">ClipCoba</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Button onClick={() => navigate('/dashboard')} size="sm" className="rounded-full">
                                Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                                    Log in
                                </Button>
                                <Button onClick={() => navigate('/register')} size="sm" className="rounded-full px-6">
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-32 pb-20 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full opacity-30" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Hero Text */}
                        <div className="space-y-8 text-center lg:text-left">
                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                                    Turn inspiration into viral scripts with AI.
                                </span>
                            </h1>

                            <ul className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 space-y-2 list-none">
                                <li className="flex items-center gap-2 justify-center lg:justify-start">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                    Snap videos instantly
                                </li>
                                <li className="flex items-center gap-2 justify-center lg:justify-start">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                    Organize with smart tags
                                </li>
                                <li className="flex items-center gap-2 justify-center lg:justify-start">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                    Write viral scripts effortlessly
                                </li>
                            </ul>

                            <div className="flex items-center justify-center lg:justify-start gap-4">
                                <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105" onClick={() => navigate('/register')}>
                                    Start Creating
                                </Button>
                            </div>
                        </div>

                        {/* Feature Grid (Shifted up to be above fold) */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Feature 1: Snap & Save */}
                            <div className="group p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5">
                                <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-500/30 transition-colors">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Snap & Save</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    One-click capture from YouTube.
                                </p>
                            </div>

                            {/* Feature 2: AI Intelligence */}
                            <div className="group p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple/5 mt-8">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">AI Intelligence</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Viral ideas & scripts in seconds.
                                </p>
                            </div>

                            {/* Feature 3: Scripting */}
                            <div className="group p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue/5">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                                    <PenTool className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Editor</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Distraction-free script writing.
                                </p>
                            </div>

                            {/* Feature 4: Organization */}
                            <div className="group p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber/5 mt-8">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-500/30 transition-colors">
                                    <FolderOpen className="w-5 h-5 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Library</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Smart tags & organization.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-white/5 py-8 mt-auto">
                <div className="container mx-auto px-6 text-center text-muted-foreground text-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <p>&copy; {new Date().getFullYear()} ClipCoba</p>
                    <button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors">
                        Privacy Policy
                    </button>
                </div>
            </footer>
        </div>
    );
};
