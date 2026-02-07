import { useState } from 'react';
import { FileUp, Printer, Play, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'ready' | 'slicing' | 'completed' | 'error'>('idle');
    const [fileId, setFileId] = useState<string | null>(null);
    const [gcodeUrl, setGcodeUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');  // Reset to idle so upload button works
            setFileId(null);    // Clear previous file ID
            setGcodeUrl(null);  // Clear previous results
            setError(null);
        }
    };

    const uploadFile = async () => {
        if (!file) return;
        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setFileId(data.objectName);  // Use objectName as the identifier
            setStatus('ready');
        } catch (err) {
            console.error(err);
            setError('Failed to upload file');
            setStatus('error');
        }
    };

    const sliceFile = async () => {
        if (!fileId) return;
        setStatus('slicing');

        try {
            const res = await fetch(`${API_URL}/slice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objectName: fileId,  // fileId is actually the objectName from upload response
                    printerId: 'Ender3V3SE',
                    profileId: 'simple'
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || 'Slicing failed');
            }

            const data = await res.json();
            setGcodeUrl(data.gcodeUrl);
            setStatus('completed');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to slice file');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-8 flex flex-col items-center">
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-4">
                    Print Stack
                </h1>
                <p className="text-slate-400">Sprint 1: Vertical Slice (File → G-Code)</p>
            </header>

            <div className="w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-800 p-8 shadow-2xl">
                {/* Step 1: Upload */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${status === 'idle' || status === 'uploading' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            <FileUp size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">1. Upload Model</h2>
                    </div>

                    <div className="flex gap-4">
                        <input
                            type="file"
                            accept=".stl,.3mf,.obj"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-blue-400 hover:file:bg-slate-700 cursor-pointer"
                        />
                        <button
                            onClick={uploadFile}
                            disabled={!file || status !== 'idle'}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                        >
                            {status === 'uploading' ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>

                {/* Step 2: Configure & Slice */}
                <div className={cn("mb-8 transition-opacity duration-300",
                    (status === 'ready' || status === 'slicing' || status === 'completed') ? 'opacity-100' : 'opacity-30 pointer-events-none'
                )}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${status === 'ready' || status === 'slicing' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Printer size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">2. Slice Configuration</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Printer</label>
                            <select disabled className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300">
                                <option>Creality Ender 3 V3 SE</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Profile</label>
                            <select disabled className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300">
                                <option>Standard (0.20mm)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={sliceFile}
                        disabled={status !== 'ready'}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all"
                    >
                        {status === 'slicing' ? (
                            <>Slicing...</>
                        ) : (
                            <><Play size={20} fill="currentColor" /> Slice Now</>
                        )}
                    </button>
                </div>

                {/* Step 3: Result */}
                {status === 'completed' && gcodeUrl && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                                <Download size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-400">Slicing Completed!</h3>
                                <p className="text-sm text-green-500/60">Your G-Code is ready for download.</p>
                            </div>
                        </div>
                        <a
                            href={gcodeUrl}
                            download
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                        >
                            Download G-Code
                        </a>
                    </div>
                )}

                {status === 'error' && error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-center">
                        {error}
                    </div>
                )}

            </div>
        </div>
    );
}

export default App;
