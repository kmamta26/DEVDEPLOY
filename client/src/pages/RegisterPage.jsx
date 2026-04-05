import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Mail, Lock, LogIn, ShieldAlert, Loader2, Command, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/register', { email, password });
            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-black font-inter selection:bg-purple-500/30 selection:text-white">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4 shadow-xl">
                        <Command className="text-black" size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Create Account</h1>
                    <p className="text-zinc-500 text-sm mt-1">Sign up to start deploying your projects.</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 space-y-6 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email Address</label>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Password</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                                required
                            />
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm font-medium"
                            >
                                <ShieldAlert size={16} />
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm font-medium"
                            >
                                ✓ {success}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 bg-white text-black rounded-lg font-bold text-sm tracking-tight transition-all hover:shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Sign Up
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-4 border-t border-zinc-800">
                        <p className="text-zinc-500 text-sm text-center">
                            Already have an account? {' '}
                            <Link 
                                to="/login"
                                className="text-white hover:text-purple-400 cursor-pointer transition-colors font-medium"
                            >
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
