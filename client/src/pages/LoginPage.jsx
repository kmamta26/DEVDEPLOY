import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Mail, Lock, LogIn, ShieldAlert, Loader2, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/login', { email, password });
            localStorage.setItem('devdeploy_token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid email or password.');
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
                    <h1 className="text-xl font-bold text-white tracking-tight">Log in to DevDeploy</h1>
                    <p className="text-zinc-500 text-sm mt-1">Enter your credentials to access your dashboard.</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 space-y-6 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email Address</label>
                            <input 
                                type="email" 
                                className="w-full bg-black border border-zinc-900 rounded-lg px-4 py-3 text-white focus:border-white outline-none transition-all placeholder:text-zinc-800 text-sm"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-300">Password</label>
                                <span className="text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors">Forgot Password?</span>
                            </div>
                            <input 
                                type="password" 
                                className="w-full bg-black border border-zinc-900 rounded-lg px-4 py-3 text-white focus:border-white outline-none transition-all placeholder:text-zinc-800 text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs"
                                >
                                    <ShieldAlert size={14} className="shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-white text-black font-semibold py-3 rounded-lg text-sm transition-all active:scale-[0.98] hover:bg-zinc-200 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Log in <LogIn size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-zinc-600 text-xs">
                    Don't have an account? <Link to="/register" className="text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">Sign up here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
