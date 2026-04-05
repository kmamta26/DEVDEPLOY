import { motion, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

// Simplified Count Animation for Clarity
export function CountUp({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const numeric = typeof value === 'number' ? value : parseFloat(value) || 0;
    const controls = animate(0, numeric, {
      duration,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
      ease: [0.16, 1, 0.3, 1]
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{display}</span>;
}

// Clean Enterprise Stat Card
export function StatCard({ title, value, icon: Icon, description, trend }) {
  const isPercent = typeof value === 'string' && value.includes('%');
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="ui-card flex flex-col gap-4 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl shadow-indigo-500/10">
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</span>
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{trend}</span>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-3xl font-bold text-white tracking-tight">
          <CountUp value={numericValue} />
          {isPercent && <span className="text-xl text-slate-600 ml-0.5">%</span>}
        </div>
        {description && <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">{description}</p>}
      </div>
    </motion.div>
  );
}

// Minimal Premium Page Header
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 pb-6 border-b border-[#232a3f]">
      <div className="space-y-1 w-full text-center md:text-left">
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        {description && <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
      </div>
    </div>
  );
}

// Minimal Badge for Status Indicators
export function Badge({ children, color = '#6366f1', bg = 'rgba(99,102,241,0.1)' }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
      style={{ color, backgroundColor: bg }}>
      {children}
    </span>
  );
}

// Professional Empty State
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-[#232a3f] rounded-2xl bg-slate-900/10">
      <div className="p-5 rounded-3xl bg-slate-900/50 text-slate-700 mb-6 shadow-2xl border border-white/5">
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-slate-500 mt-2 mb-8 max-w-sm leading-loose">{description}</p>
      {action}
    </div>
  );
}

// High-fidelity Skeletons
export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton rounded-xl h-24 w-full shadow-inner ${className}`} />
  );
}
