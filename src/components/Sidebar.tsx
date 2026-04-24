import React from 'react';
import { Box, Play, Trash2, Cpu, Settings, Layers, Search, RefreshCw, AlertCircle, Zap, Square, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Model {
  name: string;
  size: number;
  modified_at: string;
}

interface SidebarProps {
  models: Model[];
  isLoading: boolean;
  activeModel: string | null;
  preloadedModels: string[];
  onRunModel: (name: string) => void;
  onPreloadModel: (name: string) => void;
  onUnloadModel: (name: string) => void;
  onRefresh: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  models, 
  isLoading, 
  activeModel,
  preloadedModels,
  onRunModel, 
  onPreloadModel,
  onUnloadModel,
  onRefresh 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Cloud';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const getCategory = (bytes: number) => {
    if (bytes === 0) return { label: 'Cloud', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 1) return { label: 'Small', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (gb < 3) return { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Heavy', color: 'text-red-400 bg-red-500/10 border-red-500/20', warning: true };
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full flex flex-col border-r border-zinc-800/50 bg-[#0f0f0f]">
      <div className="p-4 border-b border-zinc-800/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
              <Layers className="w-4 h-4 text-zinc-200" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-200">Local Models</span>
          </div>
          <button 
            onClick={onRefresh}
            className="p-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search models..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161616] border border-zinc-800/50 rounded-md py-1.5 pl-9 pr-3 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all font-sans"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
             <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">Syncing...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
             <AlertCircle className="w-8 h-8 text-zinc-800" />
             <span className="text-xs text-zinc-500">No models match your search.</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredModels.map((model) => {
              const cat = getCategory(model.size);
              const isRunning = activeModel === model.name;
              const isPreloaded = preloadedModels.includes(model.name);

              return (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group relative flex flex-col p-3 rounded-lg border transition-all cursor-default",
                    isRunning ? "bg-zinc-800/50 border-zinc-700 shadow-lg" : "hover:bg-zinc-800/30 border-transparent hover:border-zinc-800/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-200 truncate">{model.name}</span>
                        {isRunning && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider", cat.color)}>
                          {cat.label}
                        </span>
                        {cat.label === 'Small' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 font-medium uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-2 h-2" />
                            Recommended
                          </span>
                        )}
                        {isPreloaded && !isRunning && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 font-medium uppercase tracking-wider">
                            Preloaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-col text-[10px] text-zinc-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Box className="w-3 h-3" />
                        <span>{formatSize(model.size)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isRunning ? (
                        <button 
                          onClick={() => onUnloadModel(model.name)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold transition-all"
                        >
                          <Square className="w-2.5 h-2.5 fill-current" />
                          STOP
                        </button>
                      ) : (
                        <>
                          {!isPreloaded ? (
                            <button 
                              onClick={() => onPreloadModel(model.name)}
                              className="p-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all"
                              title="Preload into RAM"
                            >
                              <Zap className="w-3 h-3" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => onUnloadModel(model.name)}
                              className="p-1 rounded bg-zinc-800 border border-zinc-700 text-purple-400 hover:text-purple-300 hover:bg-zinc-700 transition-all"
                              title="Unload from RAM"
                            >
                              <Minimize2 className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={() => onRunModel(model.name)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 text-zinc-950 hover:bg-white text-[10px] font-bold transition-all shadow-sm"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            RUN
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {cat.warning && !isRunning && !isPreloaded && (
                    <div className="mt-2 text-[9px] text-red-900/60 font-medium px-2 py-1 rounded bg-red-950/20 border border-red-900/10">
                      ⚠️ Risky on HDD. First load might take ~2m.
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800/50 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-800 flex items-center justify-center">
              <span className="text-[10px] font-bold text-zinc-400">UA</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-300">Ollama User</span>
            <span className="text-[10px] text-zinc-600 lowercase">Local Manager</span>
          </div>
          <button className="ml-auto p-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
