import { useEffect, useState } from 'react';
import api from '../api';
import { Home, List, Trash2, Globe, Send, Shield, Search, Filter, Loader2, ExternalLink, Copy, Terminal, Server, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error('Fetch project failed');
        } finally {
            setLoading(false);
        }
    };

    const deleteProject = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            alert('Deletion failed');
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-in p-8 lg:p-12 mb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-zinc-900 pb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage and monitor all your deployed infrastructure.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find target project..."
                            className="bg-black border border-zinc-900 rounded-lg pl-10 pr-4 py-2.5 text-white font-medium placeholder:text-zinc-700 w-full md:w-64 outline-none focus:border-zinc-700 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                    <Loader2 className="text-zinc-500 animate-spin" size={32} />
                    <p className="text-zinc-600 font-medium text-xs tracking-wider uppercase">Fetching data sequence...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xxl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredProjects.map((project, idx) => (
                            <motion.div 
                                key={project.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col min-h-[340px] hover:border-zinc-800 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                
                                <div className="p-8 space-y-8 flex-1 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-zinc-900 rounded-lg text-zinc-500 group-hover:text-white transition-colors border border-zinc-800">
                                            <Server size={20} />
                                        </div>
                                        <div className={`status-badge min-w-[70px] text-center ${
                                            project.status === 'Live' ? 'status-live' :
                                            project.status === 'Failed' ? 'status-failed' :
                                            'status-deploying animate-pulse'
                                        }`}>
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'Live' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-current'}`} />
                                                {project.status === 'Deploying' ? 'Deploying...' : project.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white tracking-tight">{project.name}</h3>
                                        <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-medium tracking-wide">
                                            <span className="flex items-center gap-2 underline underline-offset-4 decoration-zinc-800">us-east-1a</span>
                                            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                            <span className="flex items-center gap-2">Node: cluster-0</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600">
                                            <span>MAPPING ID</span>
                                            <span className="text-zinc-500 font-mono tracking-widest">{project.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600">
                                            <span>CREATED AT</span>
                                            <span className="text-zinc-500 uppercase">Apr 4, 2026</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 pt-0 flex gap-4 relative z-10">
                                    <a 
                                        href={project.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-white text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        Open App <ExternalLink size={16} />
                                    </a>
                                    <button 
                                        onClick={() => deleteProject(project.id)}
                                        className="p-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-lg transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredProjects.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-20 bg-zinc-950 border border-zinc-900 rounded-2xl border-dashed text-center space-y-6">
                            <div className="p-8 bg-zinc-900 rounded-full text-zinc-700 opacity-40">
                                <Send size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-500 tracking-tight">No projects detected.</h3>
                            <p className="text-zinc-600 text-sm font-medium leading-relaxed max-w-sm">Use the "Upload Project" center to initiate your first deployment.</p>
                            <button className="bg-zinc-800 text-white font-semibold py-3 px-6 rounded-lg text-sm hover:bg-zinc-700 transition-all">
                                New Uplink
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
