
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <Logo className="h-8 w-auto text-primary" />
                        <span className="font-bold text-lg">ClipCoba</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </header>

            <main className="flex-1 py-12">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

                    <div className="prose prose-invert max-w-none space-y-8 text-white">
                        <section>
                            <p className="lead text-xl text-white">
                                Last updated: December 19, 2025
                            </p>
                            <p className="text-white">
                                At Clip Coba, we value your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and Chrome Extension.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-white">1. Information We Collect</h2>
                            <p className="mb-4 text-white">We collect minimal data necessary to provide our services:</p>
                            <ul className="list-disc pl-6 space-y-2 text-white">
                                <li><strong>Account Information:</strong> When you register, we collect your email address and password (encrypted).</li>
                                <li><strong>Extension Data:</strong> If you use our Chrome Extension, we collect the YouTube Video IDs and Titles of the videos you explicitly choose to "Snap" (save). We also store your authentication token locally to sync with your account.</li>
                                <li><strong>Usage Data:</strong> We may collect anonymous usage statistics to improve our service functionality.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-white">2. How We Use Your Information</h2>
                            <p className="mb-4 text-white">We use your data solely for the following purposes:</p>
                            <ul className="list-disc pl-6 space-y-2 text-white">
                                <li>To provide and maintain the Clip Coba service.</li>
                                <li>To save and organize the video clips you select in your personal library.</li>
                                <li>To authenticate you across our web application and browser extension.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-white">3. Data Sharing and Disclosure</h2>
                            <p className="text-white">
                                <strong>We do not sell your personal data.</strong> We do not share your personal information with third parties, except as necessary to provide the service (e.g., using a database provider) or to comply with the law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Security</h2>
                            <p className="text-white">
                                We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-white">5. Your Rights</h2>
                            <p className="text-white">
                                You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-white">6. Contact Us</h2>
                            <p className="text-white">
                                If you have any questions about this Privacy Policy, please contact us at support@clipcoba.com.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="border-t py-8">
                <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} ClipCoba. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
