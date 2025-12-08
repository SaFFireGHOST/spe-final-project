import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, LogIn, AlertCircle, Train } from 'lucide-react';

export const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(phone, password);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(222,60%,35%)] via-[hsl(230,55%,35%)] to-[hsl(240,50%,30%)] p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[hsl(82,72%,48%)]/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[hsl(240,50%,55%)]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl"></div>

                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-urban-xl border border-white/20 transform transition-all duration-300 hover:shadow-2xl">
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[hsl(222,60%,35%)] to-[hsl(240,50%,45%)] rounded-2xl mb-4 shadow-urban-lg">
                            <Train className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground font-display">
                            Welcome Back
                        </h2>
                        <p className="text-muted-foreground mt-2">Sign in to continue your journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <p className="text-destructive text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
                                Phone Number
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-background border-2 border-input rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground"
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-background border-2 border-input rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[hsl(222,60%,35%)] to-[hsl(240,50%,45%)] text-white font-semibold py-3.5 px-6 rounded-xl hover:shadow-urban-lg focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-300 shadow-urban hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6"
                        >
                            <LogIn className="w-5 h-5" />
                            Sign In
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
