import { useState } from 'react';
import api from '../api';
import { Globe, Send, GitBranch, Shield, Loader2, ExternalLink, ArrowRight, Zap, Server, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GithubPage = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState('');

    const handleDeploy = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatus(null);

        try {
            const res = await api.post('/github/deploy', { repoUrl });
            setStatus(res.data.project);
            setRepoUrl('');
        } catch (err) {
            setError(err.response?.data?.error || 'GitHub connection failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-8 lg:p-12 min-h-screen flex flex-col justify-center -mt-10">
            <header className="flex flex-col items-center text-center space-y-4">
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-zinc-500 hover:text-white transition-all transform hover:-translate-y-1 duration-300">
                    <GitBranch size={32} />
                </div>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Import Git Repository</h1>
                    <p className="text-zinc-500 text-sm font-medium">Quickly deploy your application from a Public GitHub link.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="space-y-6">
                    <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl space-y-8 relative overflow-hidden group hover:border-zinc-800 transition-colors">
                        <div className="flex items-center gap-4">
                             <h2 className="text-md font-bold text-white tracking-wide">Repository Details</h2>
                             <HelpCircle size={14} className="text-zinc-700 hover:text-zinc-500 cursor-pointer" />
                        </div>

                        <form onSubmit={handleDeploy} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">GitHub URL</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        placeholder="https://github.com/username/repository"
                                        className="w-full px-5 py-3.5 bg-black border border-zinc-900 rounded-xl text-white focus:border-zinc-400 outline-none transition-all font-medium placeholder:text-zinc-800 text-sm shadow-inner"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-4 text-md font-bold h-14 shadow-lg group hover:bg-zinc-200"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin text-black" />
                                        Fetching repository data...
                                    </>
                                ) : (
                                    <>
                                        Import Repository <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                        
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-4 text-xs font-semibold leading-relaxed"
                                >
                                    <Shield size={18} className="text-red-500 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-5 hover:border-zinc-800 transition-colors">
                             <div className="p-3 bg-zinc-900 rounded-xl text-zinc-500">
                                 <Shield size={20} />
                             </div>
                             <div className="space-y-0.5">
                                 <h3 className="text-xs font-bold text-white uppercase tracking-wider">Secure Proxy Sync</h3>
                                 <p className="text-zinc-500 text-[10px] font-medium tracking-wide uppercase opacity-60">Verified SSL Encryption (v4.3)</p>
                             </div>
                             <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/50 shadow-[0_0_10px]" />
                        </div>
                    </div>
                </div>

                <div className="h-full min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {status ? (
                            <motion.div 
                                key="status"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-950 border border-zinc-800 p-10 rounded-2xl space-y-10 relative overflow-hidden h-full flex flex-col justify-center shadow-2xl"
                            >
                                <div className="p-8 bg-zinc-900/40 rounded-3xl flex flex-col items-center text-center gap-6 border border-zinc-800 border-dashed">
                                    <div className="p-5 bg-white rounded-2xl shadow-2xl transform rotate-3 flex items-center justify-center">
                                        <Send size={32} className="text-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-white tracking-tight">{status.name}</h3>
                                        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest opacity-60">Repository Link Established</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10">
                                    {[
                                        { label: 'STATUS', value: status.status, color: 'text-amber-500' },
                                        { label: 'REGION', value: 'us-east-1a', color: 'text-white' },
                                        { label: 'NODE', value: 'cluster-0', color: 'text-white' },
                                        { label: 'PROTOCOL', value: 'SSH-RSA4096', color: 'text-zinc-600' },
                                    ].map((field, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-zinc-900 pb-4">
                                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">{field.label}</span>
                                            <span className={`${field.color} font-bold uppercase tracking-widest text-xs flex items-center gap-3`}>
                                                {field.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
                                    <p className="text-[10px] text-zinc-600 leading-relaxed font-bold uppercase tracking-[0.2em] italic">
                                        Redirecting to live project in 3s...
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-zinc-950 border border-zinc-900 border-dashed p-16 rounded-2xl flex flex-col items-center justify-center text-center h-full space-y-8 group transition-colors hover:border-zinc-800">
                               <div className="w-20 h-20 bg-zinc-900/40 rounded-full flex items-center justify-center mb-6 border border-zinc-800 opacity-20 group-hover:opacity-100 transition-opacity">
                                   <GitBranch size={32} className="text-zinc-500 group-hover:text-white" />
                               </div>
                               <div className="space-y-4">
                                   <h3 className="text-lg font-bold text-zinc-600 tracking-tight group-hover:text-zinc-400 transition-colors italic uppercase">Import Source Protocol</h3>
                                   <p className="text-zinc-700 text-xs font-bold max-w-xs mx-auto leading-relaxed uppercase tracking-[0.15em] opacity-60">Awaiting GitHub repository URL for artifact extraction.</p>
                               </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default GithubPage;
