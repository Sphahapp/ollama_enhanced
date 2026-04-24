import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, Cpu, Zap, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface TerminalProps {
  onInput?: (data: string) => void;
  command?: string | null;
  className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ onInput, command, className }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (command && xtermRef.current) {
      setIsExecuting(true);
      xtermRef.current.writeln(`\r\n\x1b[33m⏳ Processing command: ${command}\x1b[0m`);
      xtermRef.current.writeln('\x1b[90m(HDD Protection: First run may take 1-2 minutes)\x1b[0m');
      
      // Simulate execution delay for UI feedback
      setTimeout(() => {
        xtermRef.current?.writeln('\x1b[32m✔ Connected to Ollama runtime\x1b[0m');
        xtermRef.current?.write('\x1b[32muser@ollama-ultra\x1b[0m:\x1b[34m~\x1b[0m$ ');
        setIsExecuting(false);
      }, 1500);
    }
  }, [command]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#0c0c0c',
        foreground: '#e4e4e7',
        cursor: '#71717a',
        selectionBackground: 'rgba(255, 255, 255, 0.1)',
        black: '#0c0c0c',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
      },
      allowProposedApi: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    try {
      const webglAddon = new WebglAddon();
      xterm.loadAddon(webglAddon);
    } catch (e) {
      console.warn('WebGL addon failed to load, falling back to canvas rendering', e);
    }

    xterm.open(terminalRef.current);
    
    let resizeTimer: number;
    const safeFit = () => {
      cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        try {
          if (!terminalRef.current || !xterm.element) return;
          
          const isVisible = !!(
            terminalRef.current.offsetWidth ||
            terminalRef.current.offsetHeight ||
            terminalRef.current.getClientRects().length
          );

          if (isVisible && xterm.element.closest('body')) {
            fitAddon.fit();
          }
        } catch (e) {
          // Failure to fit is non-critical
        }
      });
    };

    // Chain the first fit to after open
    requestAnimationFrame(safeFit);

    xterm.writeln('\x1b[1;36mOllama Ultra Terminal v1.0.0\x1b[0m');
    xterm.writeln('\x1b[90mManaged Local LLM Environment Loaded\x1b[0m');
    xterm.writeln('');
    xterm.write('\x1b[32muser@ollama-ultra\x1b[0m:\x1b[34m~\x1b[0m$ ');

    let currentLine = '';
    xterm.onData((data) => {
      const charCode = data.charCodeAt(0);
      if (charCode === 13) { // Enter
        xterm.write('\r\n');
        if (onInput) onInput(currentLine);
        currentLine = '';
        xterm.write('\x1b[32muser@ollama-ultra\x1b[0m:\x1b[34m~\x1b[0m$ ');
      } else if (charCode === 127) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write('\b \b');
        }
      } else {
        currentLine += data;
        xterm.write(data);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      safeFit();
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      cancelAnimationFrame(resizeTimer);
      resizeObserver.disconnect();
      xterm.dispose();
    };
  }, []);

  return (
    <div className={`flex flex-col h-full rounded-lg overflow-hidden border border-zinc-800/50 bg-[#0c0c0c] ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-[#141414]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono font-medium text-zinc-400">ollama-terminal-v1</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 grayscale opacity-50">
             <Activity className="w-3 h-3 text-green-500" />
             <span className="text-[10px] font-mono text-zinc-500">IDLE</span>
          </div>
          <div className="flex items-center gap-1.5">
             <Cpu className="w-3 h-3 text-zinc-500" />
             <span className="text-[10px] font-mono text-zinc-500">GPU ACCEL</span>
          </div>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
};
