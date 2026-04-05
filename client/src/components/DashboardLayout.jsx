import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Globe, Info, User, Layout } from 'lucide-react';

const DashboardLayout = () => {
    const location = useLocation();
    
    const getPageTitle = (path) => {
        const p = path.split('/')[1];
        return p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Dashboard';
    };

    return (
        <div className="flex h-screen bg-black text-white font-inter overflow-hidden selection:bg-purple-500/30 selection:text-white">
            <Sidebar />
            
            <main className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* Global Search/Header */}
                <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                            <Layout size={12} />
                            <span>Infrastructure</span>
                            <ChevronRight size={10} className="text-zinc-800" />
                            <span className="text-white">{getPageTitle(location.pathname)}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                             <span className="flex items-center gap-2"><Globe size={11} className="text-emerald-500/50" /> Network: Optic-V</span>
                             <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                             <span className="flex items-center gap-2"><Shield size={11} className="text-purple-500/50" /> System: Hardened</span>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-zinc-900 bg-zinc-950 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer ring-offset-black hover:ring-2 ring-purple-500/20">
                            <User size={16} />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(126,34,206,0.02),_transparent_40%)]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.01 }}
                            transition={{ 
                                duration: 0.25, 
                                ease: [0.16, 1, 0.3, 1] 
                            }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
