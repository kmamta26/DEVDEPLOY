import { useEffect, useState, useRef } from 'react';
import api from '../api';
import { Terminal, Shield, Server, Activity, Globe, Zap, Cpu, Database, ChevronRight, Share, Info, Loader2, Maximize, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AWSPage = () => {
    const [status, setStatus] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/aws/status');
                setStatus(res.data.status);
                setLogs(res.data.logs);
            } catch (err) {
                console.error('Fetch AWS status failed');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const metrics = [
        { label: 'Hypervisor Load', value: '18%', icon: <Cpu size={16} />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { label: 'Mesh Saturation', value: '42%', icon: <Activity size={16} />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        { label: 'Database Sync', value: 'Active', icon: <Database size={16} />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { label: 'Global Latency', value: '12ms', icon: <Zap size={16} />, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    ];

    return (
        <div className="space-y-10 animate-fade-in p-8 lg:p-12 mb-12 h-screen flex flex-col -mt-10 overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 shrink-0 border-b border-zinc-900 pb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight uppercase italic">AWS Infrastructure <span className="text-zinc-600 font-normal">Console</span></h1>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em] opacity-60 italic">Real-time infrastructure logs and telemetry system.</p>
                </div>
                
                <div className="flex items-center gap-6 bg-black border border-zinc-900 rounded-xl px-6 py-4 shadow-2xl relative group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-3.5 h-3.5 rounded-full ${status === 'Running' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`} />
                        <div className="space-y-0.5">
                            <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest leading-none block">System Health</span>
                            <span className="text-white text-xs font-bold uppercase tracking-widest leading-none pt-1 block tracking-tighter italic">
                                {status === 'Running' ? 'Active / Synchronized' : 'Idle / Offline'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                {metrics.map((metric, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="bg-zinc-950 border border-zinc-900 p-6 rounded-xl space-y-4 hover:border-zinc-800 transition-colors"
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border font-medium ${metric.color}`}>
                            {metric.icon}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{metric.label}</h3>
                            <p className="text-lg font-bold text-white tracking-tight uppercase italic">{metric.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex-1 min-h-0 bg-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-900 bg-zinc-950/80 z-20">
                    <div className="flex items-center gap-6">
                        <div className="p-2.5 bg-white text-black rounded-lg shadow-xl font-bold">
                            <Terminal size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase italic">Infrastructure Log Aggregate</h3>
                        <div className="flex items-center gap-3 px-3 py-1 bg-black border border-zinc-900 rounded-lg">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.3)] animate-pulse" />
                             <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em] italic uppercase">Uplink Secured</span>
                        </div>
                    </div>
                </div>

                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-10 space-y-5 font-mono text-[10px] leading-relaxed relative bg-black/40 custom-scrollbar"
                >
                    <AnimatePresence>
                        {logs.map((log, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex gap-6 group/log transition-all ${log.type === 'ERROR' ? 'text-red-500' : 'text-zinc-500'}`}
                            >
                                <span className={`w-28 shrink-0 font-bold opacity-30 group-hover/log:opacity-100 transition-opacity`}>[{log.timestamp}]</span>
                                <span className={`w-16 shrink-0 font-bold uppercase tracking-widest ${log.type === 'ERROR' ? 'text-red-600' : 'text-zinc-600'}`}>{log.type}</span>
                                <span className={`flex-1 opacity-70 group-hover/log:opacity-100 uppercase tracking-widest italic ${log.type === 'ERROR' ? 'font-bold' : ''}`}>{log.message}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!loading && logs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                             <Terminal size={80} className="text-zinc-700" />
                             <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-700 italic">No telemetry data manifold detected.</p>
                        </div>
                    )}
                </div>
                
                <div className="px-8 py-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">
                    <div className="flex gap-8">
                        <span className="flex items-center gap-3"><Cpu size={12} className="opacity-40" /> NODE: X64_AMD_64_STABLE</span>
                        <span className="flex items-center gap-3"><Globe size={12} className="opacity-40" /> REGION: US_EAST_1_A</span>
                    </div>
                    <span className="text-zinc-800 italic uppercase">System Manifest Console v4.0.21</span>
                </div>
            </div>
        </div>
    );
};

export default AWSPage;
