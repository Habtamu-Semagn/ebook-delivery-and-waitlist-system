import auth from "../lib/firebase";
import { createFileRoute } from "@tanstack/react-router"
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { ArrowLeft, BookOpen, Mail, Lock, User } from "lucide-react"
import { Button } from "../components/ui/Button"

export const Route = createFileRoute('/signup')({
    component: SignupPage,
})

function SignupPage() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const syncUserWithBackend = async (token: string) => {
        await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
    }

    const validateForm = (): boolean => {
        if (!name.trim()) {
            setError('Full name is required');
            return false;
        }
        if (!email.trim()) {
            setError('Email is required');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    }

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Check if user already exists by attempting to create account
            const result = await createUserWithEmailAndPassword(auth, email, password);
            
            // Only proceed if account was successfully created (new user)
            if (result.user) {
                // Update user profile with name
                const { updateProfile } = await import('firebase/auth');
                await updateProfile(result.user, {
                    displayName: name
                });

                const token = await result.user.getIdToken();
                await syncUserWithBackend(token);
                
                // Redirect to home after successful signup
                window.location.href = '/';
            }
        } catch (err: any) {
            const errorCode = err.code;
            let errorMessage = 'An error occurred during signup';
            
            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead or use a different email.';
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 6 characters.';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (errorCode === 'auth/operation-not-allowed') {
                errorMessage = 'Account creation is currently disabled. Please try again later.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            
            const token = await result.user.getIdToken();
            await syncUserWithBackend(token);
            
            window.location.href = '/';
        } catch (err: any) {
            console.error('Google signup error: ', err)
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#020617', minHeight: '100vh' }} className="flex items-center justify-center px-6 py-12">
            {/* Back button */}
            <button
                onClick={() => window.history.back()}
                className="absolute top-6 left-6 p-2 rounded-lg transition-colors"
                style={{
                    color: '#94A3B8',
                    background: '#1E293B',
                    border: '1px solid #334155',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#334155'
                    e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1E293B'
                    e.currentTarget.style.color = '#94A3B8'
                }}
            >
                <ArrowLeft size={20} />
            </button>

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #134e4a, #064e3b)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <BookOpen size={24} color="#10B981" />
                        </div>
                        <span className="text-2xl font-medium text-white">
                            book<span style={{ color: '#10B981' }}>shelf</span>
                        </span>
                    </div>
                    <h1 className="text-3xl font-medium text-white mb-2">Create your account</h1>
                    <p style={{ color: '#94A3B8' }}>Join our community to start reading</p>
                </div>

                {/* Card */}
                <div
                    style={{
                        background: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,.35)',
                    }}
                    className="p-8"
                >
                    {error && (
                        <div
                            className="mb-6 p-4 rounded-lg text-sm"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#FCA5A5',
                            }}
                        >
                            <div className="mb-2">{error}</div>
                            {error.includes('already registered') && (
                                <a 
                                    href="/login" 
                                    style={{ color: '#10B981', textDecoration: 'underline' }}
                                    className="font-medium text-xs"
                                >
                                    → Sign in to your account
                                </a>
                            )}
                        </div>
                    )}

                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
                        <div>
                            <label style={{ color: '#94A3B8' }} className="text-sm font-medium block mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#475569' }} />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value ?? '')}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid #334155',
                                        color: '#FFFFFF',
                                        paddingLeft: '38px',
                                    }}
                                    className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: '#94A3B8' }} className="text-sm font-medium block mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#475569' }} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value ?? '')}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid #334155',
                                        color: '#FFFFFF',
                                        paddingLeft: '38px',
                                    }}
                                    className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: '#94A3B8' }} className="text-sm font-medium block mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#475569' }} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value ?? '')}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid #334155',
                                        color: '#FFFFFF',
                                        paddingLeft: '38px',
                                    }}
                                    className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: '#94A3B8' }} className="text-sm font-medium block mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#475569' }} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value ?? '')}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid #334155',
                                        color: '#FFFFFF',
                                        paddingLeft: '38px',
                                    }}
                                    className="w-full px-4 py-2 rounded-lg outline-none transition-colors"
                                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div style={{ borderTop: '1px solid #334155' }} />
                        <div
                            style={{
                                position: 'absolute',
                                top: '-8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#1E293B',
                                padding: '0 12px',
                                color: '#94A3B8',
                                fontSize: '12px',
                            }}
                        >
                            Or continue with
                        </div>
                    </div>

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        type="button"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid #334155',
                            color: '#FFFFFF',
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.25s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                            e.currentTarget.style.borderColor = '#334155'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        </svg>
                        Sign up with Google
                    </button>

                    {/* Sign in link */}
                    <p style={{ color: '#94A3B8' }} className="text-sm text-center mt-6">
                        Already have an account?{' '}
                        <a href="/login" style={{ color: '#10B981' }} className="font-medium hover:underline">
                            Sign in
                        </a>
                    </p>
                </div>

                {/* Footer note */}
                <p style={{ color: '#475569' }} className="text-xs text-center mt-6">
                    By signing up, you agree to our{' '}
                    <a href="#" style={{ color: '#10B981' }} className="hover:underline">
                        Terms
                    </a>
                    {' '}and{' '}
                    <a href="#" style={{ color: '#10B981' }} className="hover:underline">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    )
}
