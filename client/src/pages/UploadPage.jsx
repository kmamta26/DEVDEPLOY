import { useState, useCallback } from 'react';
import api from '../api';
import { Upload, FileText, Check, AlertCircle, Loader2, Zap, Server, Shield, Send, X, Box, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadPage = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState('');

    const onDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.zip')) {
            setFile(droppedFile);
            setError('');
        } else {
            setError('Incompatible Artifact. Use .ZIP format.');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError('');
        setStatus(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('zipFile', file);

        try {
            const res = await api.post('/projects/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });
            setStatus({ name: res.data.project.name, url: res.data.project.url });
            setFile(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Uplink Failed. Connection Refused.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in p-8 lg:p-12 min-h-screen flex flex-col items-center justify-center -mt-10">
            <header className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                    <Upload className="text-black" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Upload Project</h1>
                <p className="text-zinc-500 text-sm font-medium max-w-[440px] mx-auto leading-relaxed">
                    Deploy your static site or web app by dragging and dropping your source folder (ZIP artifact).
                </p>
            </header>

            <div className="w-full space-y-8">
                <AnimatePresence mode="wait">
                    {!status ? (
                        <motion.div 
                            key="upload-form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            <div 
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={onDrop}
                                className={`relative group p-10 lg:p-20 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                                    file ? 'border-zinc-100 bg-zinc-950' : 'border-zinc-900 border-dashed hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950 transition-colors'
                                }`}
                            >
                                <input 
                                    type="file" 
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-50 text-[0px]"
                                    accept=".zip"
                                />

                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className={`p-6 rounded-2xl border border-zinc-900 bg-zinc-950 text-zinc-500 shadow-xl transition-all duration-300 group-hover:-translate-y-2 ${file ? 'text-white border-zinc-700' : ''}`}>
                                        <Box size={40} />
                                    </div>
                                    <div className="space-y-4 px-2">
                                        <h3 className="text-xl font-bold text-white tracking-tight min-h-[56px] flex items-center justify-center">
                                            {file ? file.name : (
                                                <span className="text-zinc-400 group-hover:text-white transition-colors">Select your project repository</span>
                                            )}
                                        </h3>
                                        <p className="text-zinc-600 text-xs font-semibold tracking-wide uppercase leading-relaxed max-w-[280px]">
                                            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB ARCHIVE DETECTED` : 'Drag and drop your .zip package or browse your network'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center space-y-8">
                                {uploading ? (
                                    <div className="w-full max-w-sm space-y-6">
                                        <div className="flex justify-between text-[11px] font-bold text-zinc-500 p-1">
                                            <span className="uppercase tracking-widest">TRANSMITTING...</span>
                                            <span className="text-white">{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-900 rounded-full p-0.5 shadow-inner relative overflow-hidden">
                                           <motion.div 
                                               initial={{ width: 0 }}
                                               animate={{ width: `${progress}%` }}
                                               className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                                           />
                                        </div>
                                        <div className="flex justify-center items-center gap-4 px-4">
                                            <Loader2 size={16} className="animate-spin text-zinc-500" />
                                            <span className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase">Secured Link Established</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-sm space-y-4">
                                        <button 
                                            onClick={handleUpload}
                                            disabled={!file}
                                            className="btn-primary py-4 rounded-xl text-md font-bold h-14 w-full shadow-lg group hover:tracking-wide transition-all shadow-black/40"
                                        >
                                            Deploy Now <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={() => setFile(null)}
                                            style={{ display: file ? 'flex' : 'none' }}
                                            className="w-full p-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            Discard Archive <X size={14} className="ml-2" />
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-4 max-w-md w-full text-xs font-semibold"
                                    >
                                        <div className="p-2.5 bg-red-500/20 rounded-lg shrink-0">
                                            <AlertTriangle size={18} className="text-red-400" />
                                        </div>
                                        {error}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-950 border border-zinc-800 p-16 rounded-3xl flex flex-col items-center text-center space-y-10 relative overflow-hidden h-[540px] justify-center shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-zinc-900/40 rounded-full flex items-center justify-center border-4 border-zinc-800 relative z-10 shadow-2xl mb-2">
                                <Check size={48} className="text-emerald-500 animate-pulse" />
                            </div>
                            
                            <div className="space-y-4 relative z-10 max-w-md mx-auto">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{status.name}</h3>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed uppercase tracking-wider">Project successfully deployed to your infrastructure.</p>
                                <div className="px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 w-fit mx-auto mt-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                    <Globe size={14} className="text-emerald-500 shrink-0" /> Link Ready us-east-1
                                </div>
                            </div>

                            <div className="flex gap-4 w-full max-w-sm relative z-10 pt-4">
                                <a 
                                    href={status.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn-primary flex-1 h-14 rounded-xl text-md font-bold shadow-lg"
                                >
                                    Open App <ExternalLink size={20} className="ml-2" />
                                </a>
                                <button 
                                    onClick={() => setStatus(null)}
                                    className="btn-outline px-8 h-14 rounded-xl text-xs font-bold uppercase tracking-widest"
                                >
                                    Upload More
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <p className="mt-8 text-zinc-800 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-4">
                 <Server size={14} className="opacity-40" /> SYSTEM NODE US-EAST [ACTIVE]
            </p>
        </div>
    );
};

const ExternalLink = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>
);

export default UploadPage;
