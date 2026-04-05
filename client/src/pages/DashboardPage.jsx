import { useEffect, useState } from 'react';
import api from '../api';
import { LayoutDashboard, Rocket, Activity, Database, Zap, ArrowUpRight, ShieldCheck, Globe, Clock, History, MoreVertical, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardPage = () => {
    const [stats, setStats] = useState({ totalProjects: 0, activeDeployments: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/projects');
                const projects = res.data;
                setStats({
                    totalProjects: projects.length,
                    activeDeployments: projects.filter(p => p.status === 'Deploying').length
                });
            } catch (err) {
                console.error('Fetch stats failed');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Projects', value: stats.totalProjects, icon: <LayoutDashboard size={18} />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { title: 'Active Deployments', value: stats.activeDeployments, icon: <Rocket size={18} />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        { title: 'Database Instances', value: '2', icon: <Database size={18} />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { title: 'System Uptime', value: '99.9%', icon: <Activity size={18} />, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    ];

    return (
        <div className="space-y-10 animate-fade-in p-8 lg:p-12 selection:bg-purple-500/30">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
                    <p className="text-zinc-500 text-sm font-medium">Dashboard summary and status for your infrastructure.</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Network Operational</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="bg-zinc-950 border border-zinc-900 p-6 rounded-xl space-y-4 hover:border-zinc-800 transition-colors group relative"
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border font-medium ${card.color}`}>
                            {card.icon}
                        </div>
                        
                        <div className="space-y-1">
                            <h3 className="text-zinc-400 text-xs font-semibold tracking-wide">{card.title}</h3>
                            <p className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : card.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-zinc-950 border border-zinc-900 p-10 rounded-2xl flex flex-col justify-center space-y-8 relative overflow-hidden group min-h-[360px]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="space-y-6 relative z-10">
                        <div className="p-3 bg-white text-black w-fit rounded-lg shadow-xl font-bold">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight max-w-xl leading-snug">Secure cloud deployment pipeline with 99.9% availability SLAs.</h2>
                        <p className="text-zinc-500 text-sm font-normal leading-relaxed max-w-lg">
                            Your projects are hosted on distributed nodes with automated scaling and redundant database synchronization enabled across all regions.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <button className="bg-white text-black font-semibold px-6 py-3 rounded-lg text-sm hover:bg-zinc-200 transition-all flex items-center gap-2">
                                Manage Infrastructure <ArrowUpRight size={16} />
                            </button>
                            <button className="bg-zinc-900 text-white font-semibold px-6 py-3 rounded-lg text-sm border border-zinc-800 hover:bg-zinc-800 transition-all flex items-center gap-2">
                                Edge Config
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col p-8 space-y-8 relative overflow-hidden group h-full">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
                         <h3 className="text-sm font-bold text-white tracking-wider uppercase">Recent Activity</h3>
                         <History className="text-zinc-500" size={16} />
                    </div>
                    
                    <div className="flex-1 space-y-6">
                        {[
                            { name: 'Brew Haven Production', time: '2m ago', status: 'Live', code: 'BH_PROD_1.0' },
                            { name: 'DevDeploy Documentation', time: '14m ago', status: 'Live', code: 'DOCS_V2' },
                            { name: 'Auth API Server', time: '1h ago', status: 'Live', code: 'AUTH_API' },
                        ].map((log, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl group/log hover:border-zinc-800 transition-all cursor-pointer">
                                <div className="p-2.5 bg-zinc-900 rounded-lg text-zinc-500 group-hover/log:text-white transition-colors">
                                    <Globe size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white font-semibold text-xs tracking-tight truncate">{log.name}</span>
                                        <span className="text-zinc-600 text-[10px] font-medium shrink-0">{log.time}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500 font-mono text-[9px] tracking-widest">{log.code}</span>
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-bold">
                                            LIVE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:bg-zinc-800">
                        View All Logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
