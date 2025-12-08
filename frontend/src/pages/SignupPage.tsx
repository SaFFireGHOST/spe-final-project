import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, UserPlus, AlertCircle, Car, Users, Train } from 'lucide-react';

export const SignupPage = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('RIDER');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signup({ name, phone, password, role });
            navigate('/login');
        } catch (err) {
            setError('Signup failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(222,60%,35%)] via-[hsl(230,55%,35%)] to-[hsl(240,50%,30%)] p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[hsl(82,72%,48%)]/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[hsl(240,50%,55%)]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Signup Card */}
            <div className="relative w-full max-w-md">
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl"></div>

                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-urban-xl border border-white/20 transform transition-all duration-300 hover:shadow-2xl">
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[hsl(82,72%,48%)] to-[hsl(82,72%,40%)] rounded-2xl mb-4 shadow-lime-glow">
                            <UserPlus className="w-8 h-8 text-[hsl(222,47%,11%)]" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground font-display">
                            Create Account
                        </h2>
                        <p className="text-muted-foreground mt-2">Join us and start your journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <p className="text-destructive text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-background border-2 border-input rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

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
                                    placeholder="Create a password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
                                I want to be a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('RIDER')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${role === 'RIDER'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-input bg-background hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-lg transition-all duration-200 ${role === 'RIDER' ? 'bg-primary' : 'bg-muted'}`}>
                                            <Users className={`w-5 h-5 transition-colors ${role === 'RIDER' ? 'text-white' : 'text-muted-foreground'}`} />
                                        </div>
                                        <span className={`font-semibold text-sm ${role === 'RIDER' ? 'text-primary' : 'text-muted-foreground'}`}>
                                            Rider
                                        </span>
                                    </div>
                                    {role === 'RIDER' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole('DRIVER')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${role === 'DRIVER'
                                        ? 'border-accent bg-accent/5'
                                        : 'border-input bg-background hover:border-accent/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-lg transition-all duration-200 ${role === 'DRIVER' ? 'bg-accent' : 'bg-muted'}`}>
                                            <Car className={`w-5 h-5 transition-colors ${role === 'DRIVER' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                                        </div>
                                        <span className={`font-semibold text-sm ${role === 'DRIVER' ? 'text-accent' : 'text-muted-foreground'}`}>
                                            Driver
                                        </span>
                                    </div>
                                    {role === 'DRIVER' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-[hsl(82,72%,48%)] text-[hsl(222,47%,11%)] font-semibold py-3.5 px-6 rounded-xl hover:shadow-lime-glow focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all duration-300 shadow-urban hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6"
                        >
                            <UserPlus className="w-5 h-5" />
                            Create Account
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
