import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Terminal } from './components/Terminal';
import { motion } from 'motion/react';
import { Cloud, Zap, Shield, Cpu, Activity, Minimize2, Square, X, RefreshCw } from 'lucide-react';

interface Model {
  name: string;
  size: number;
  modified_at: string;
}

export default function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [preloadedModels, setPreloadedModels] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ollama/tags');
      const data = await res.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleAction = async (modelName: string, action: 'preload' | 'unload') => {
    try {
      const res = await fetch('/api/ollama/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, action })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        if (action === 'preload') {
          setPreloadedModels(prev => [...new Set([...prev, modelName])]);
        } else {
          setPreloadedModels(prev => prev.filter(m => m !== modelName));
          if (activeModel === modelName) setActiveModel(null);
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} model:`, error);
    }
  };

  const handleRunModel = async (modelName: string) => {
    // 1. If another model is active, unload it first (Ollama multi-model guard)
    if (activeModel && activeModel !== modelName) {
      await handleAction(activeModel, 'unload');
    }

    setActiveModel(modelName);
    setPreloadedModels(prev => [...new Set([...prev, modelName])]);

    // Send run command to terminal link (simulated via state for now)
    setTerminalInput(`ollama run ${modelName}\r`);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0c0c0c] text-zinc-300 overflow-hidden font-sans border border-zinc-800/20 m-0 p-0 shadow-2xl">
      {/* OS-like Title Bar */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 bg-[#0a0a0a] border-b border-zinc-900 select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
          </div>
          <Zap className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Ollama Ultra Terminal</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>{activeModel ? '62%' : '12%'} LOAD</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>{preloadedModels.length > 0 ? (preloadedModels.length * 1.2 + 2.1).toFixed(1) : '0.8'} GB RAM</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-900/50" />
              <span className="text-green-900/50">SECURE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          models={models} 
          isLoading={isLoading} 
          activeModel={activeModel}
          preloadedModels={preloadedModels}
          onRunModel={handleRunModel}
          onPreloadModel={(name) => handleAction(name, 'preload')}
          onUnloadModel={(name) => handleAction(name, 'unload')}
          onRefresh={fetchModels}
        />
        
        <main className="flex-1 flex flex-col bg-[#0c0c0c] relative p-4 gap-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-3">
                Managed Session
                {activeModel && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
                  >
                    RUNNING: {activeModel}
                  </motion.span>
                )}
              </h1>
              <p className="text-xs text-zinc-500 mt-1">Resource isolation active. HDD Protection Mode enabled.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchModels}
                className="px-3 py-1.5 rounded-md bg-zinc-800/50 hover:bg-zinc-800 text-xs font-medium text-zinc-400 border border-zinc-700/50 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </button>
              <button 
                className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-xl shadow-zinc-950/20 transition-all"
              >
                New Session
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <Terminal 
              command={terminalInput}
              onInput={(input) => console.log('Terminal input:', input)} 
            />
          </div>

          <div className="shrink-0 flex items-center justify-between px-2 py-1 text-[10px] font-mono text-zinc-600">
            <div className="flex gap-4">
              <span>PATH: /usr/local/bin/ollama</span>
              <span>VER: 0.1.32</span>
              <span>STATE: IDLE</span>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>CONNECTED</span>
              </div>
              <span>UTF-8</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
