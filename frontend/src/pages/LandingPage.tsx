import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, MapPin, Zap, Shield, Clock, ArrowRight, LogIn, UserPlus, Train, Route } from 'lucide-react';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(222,60%,35%)] via-[hsl(230,55%,35%)] to-[hsl(240,50%,30%)]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-[hsl(82,72%,48%)]/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-[hsl(240,50%,55%)]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }}></div>
                {/* Geometric patterns */}
                <div className="absolute top-40 left-1/4 w-2 h-2 bg-[hsl(82,72%,48%)] rounded-full opacity-60"></div>
                <div className="absolute top-60 right-1/3 w-3 h-3 bg-[hsl(82,72%,48%)] rounded-full opacity-40"></div>
                <div className="absolute bottom-40 left-1/2 w-2 h-2 bg-white rounded-full opacity-30"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 container mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-[hsl(82,72%,48%)] rounded-xl flex items-center justify-center shadow-lime-glow">
                            <Train className="w-6 h-6 text-[hsl(222,47%,11%)]" />
                        </div>
                        <span className="text-2xl font-bold text-white font-display">LastMile</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="px-5 py-2.5 text-white/90 font-semibold hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-5 py-2.5 bg-[hsl(82,72%,48%)] text-[hsl(222,47%,11%)] font-semibold rounded-xl hover:shadow-lime-glow transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            <UserPlus className="w-4 h-4" />
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto px-6 py-16 md:py-28">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-8 border border-white/10">
                        <Route className="w-4 h-4 text-[hsl(82,72%,48%)]" />
                        <span>Smart Metro Connectivity</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight font-display">
                        Share Rides,
                        <br />
                        <span className="text-[hsl(82,72%,48%)]">Save Money</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Connect with riders and drivers for the last mile of your metro journey. Safe, affordable, and eco-friendly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-4 bg-[hsl(82,72%,48%)] text-[hsl(222,47%,11%)] font-bold text-lg rounded-xl shadow-lime-glow hover:shadow-[0_0_40px_hsla(82,72%,48%,0.5)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-xl border-2 border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            I Have an Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 font-display">
                        Why Choose LastMile?
                    </h2>
                    <p className="text-white/60 text-center mb-16 text-lg">Smart solutions for your daily commute</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-[hsl(82,72%,48%)]/30 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-[hsl(82,72%,48%)] to-[hsl(82,72%,40%)] rounded-2xl flex items-center justify-center mb-6 shadow-lime-glow group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-7 h-7 text-[hsl(222,47%,11%)]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 font-display">Fast Matching</h3>
                            <p className="text-white/70 text-lg leading-relaxed">
                                Get matched with riders or drivers instantly based on your metro station and destination.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-[hsl(240,50%,55%)]/30 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-[hsl(240,50%,55%)] to-[hsl(240,50%,45%)] rounded-2xl flex items-center justify-center mb-6 shadow-blue-glow group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 font-display">Safe & Secure</h3>
                            <p className="text-white/70 text-lg leading-relaxed">
                                Verified users, real-time tracking, and secure payment options for peace of mind.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-[hsl(82,72%,48%)]/30 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-[hsl(82,72%,48%)] to-[hsl(82,72%,40%)] rounded-2xl flex items-center justify-center mb-6 shadow-lime-glow group-hover:scale-110 transition-transform duration-300">
                                <Clock className="w-7 h-7 text-[hsl(222,47%,11%)]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 font-display">Save Time</h3>
                            <p className="text-white/70 text-lg leading-relaxed">
                                No more waiting for cabs or buses. Share rides and reach your destination faster.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 font-display">
                        How It Works
                    </h2>
                    <p className="text-white/60 text-center mb-16 text-lg">Three simple steps to get started</p>
                    <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="group flex items-start gap-6 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-[hsl(82,72%,48%)]/30 transition-all duration-300">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[hsl(82,72%,48%)] to-[hsl(82,72%,40%)] rounded-xl flex items-center justify-center text-[hsl(222,47%,11%)] font-bold text-xl shadow-lime-glow">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-display">Sign Up</h3>
                                <p className="text-white/70 text-lg">
                                    Create an account as a rider or driver in seconds.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="group flex items-start gap-6 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-[hsl(240,50%,55%)]/30 transition-all duration-300">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[hsl(240,50%,55%)] to-[hsl(240,50%,45%)] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-blue-glow">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-display">Set Your Route</h3>
                                <p className="text-white/70 text-lg">
                                    Enter your metro station and destination. We'll find the perfect match.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="group flex items-start gap-6 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-[hsl(82,72%,48%)]/30 transition-all duration-300">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[hsl(82,72%,48%)] to-[hsl(82,72%,40%)] rounded-xl flex items-center justify-center text-[hsl(222,47%,11%)] font-bold text-xl shadow-lime-glow">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-display">Share & Save</h3>
                                <p className="text-white/70 text-lg">
                                    Meet your match, share the ride, and save money on your commute!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 container mx-auto px-6 py-16 mb-8">
                <div className="max-w-4xl mx-auto glass-card p-12 rounded-3xl text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">
                        Ready to Start?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8">
                        Join thousands of commuters making their last mile journey easier.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center gap-2 px-10 py-4 bg-[hsl(82,72%,48%)] text-[hsl(222,47%,11%)] font-bold text-lg rounded-xl shadow-lime-glow hover:shadow-[0_0_40px_hsla(82,72%,48%,0.5)] transition-all duration-300 transform hover:-translate-y-1"
                    >
                        Get Started Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[hsl(82,72%,48%)] rounded-lg flex items-center justify-center">
                                <Train className="w-5 h-5 text-[hsl(222,47%,11%)]" />
                            </div>
                            <span className="text-lg font-bold text-white font-display">LastMile</span>
                        </div>
                        <p className="text-white/50">
                            © 2025 LastMile. Making commutes better, together.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
