import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Upload, Layout, Globe, Server, LogOut, Terminal, Activity, Shield, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('devdeploy_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Upload Project', path: '/upload', icon: <Upload size={18} /> },
    { name: 'Your Projects', path: '/projects', icon: <Layout size={18} /> },
    { name: 'Import Git', path: '/github', icon: <Globe size={18} /> },
    { name: 'Node Status', path: '/aws', icon: <Server size={18} /> },
  ];

  return (
    <aside className="w-64 h-screen bg-black border-r border-zinc-900 flex flex-col shrink-0 relative overflow-hidden group">
      <div className="p-8 pb-10">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-xl">
            <Activity className="text-black" size={18} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-md font-bold text-white tracking-tighter">DevDeploy</h2>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5 italic">v4.0.21</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group/nav relative ${
              location.pathname === item.path 
                ? 'bg-zinc-900 text-white font-medium border border-zinc-800 shadow-xl' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
            }`}
          >
            <span className={`${location.pathname === item.path ? 'text-purple-500' : 'text-zinc-700 group-hover/nav:text-zinc-500'} transition-colors duration-200`}>
              {item.icon}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">{item.name}</span>
            
            {location.pathname === item.path && (
              <div className="absolute left-0 w-1 h-3 bg-purple-500 rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-6 mt-auto space-y-8">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
                <Shield size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Node: cluster-0</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "88%" }}
                   className="h-full bg-emerald-500/60 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.3)]" 
                />
            </div>
            <div className="flex justify-between items-center px-0.5">
                <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest leading-none">Usage</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">88%</span>
            </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all duration-200 group/logout border border-transparent hover:border-red-500/10"
        >
          <div className="flex items-center gap-3">
              <LogOut size={16} className="group-hover/logout:translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest italic">Sign Out</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover/logout:opacity-100 transition-opacity" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
