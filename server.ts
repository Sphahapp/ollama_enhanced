import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: 'web-container' });
  });

  // Proxy to Ollama or Mock Data if not available
  app.get('/api/ollama/tags', async (req, res) => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) throw new Error('Ollama not responding');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.log('Ollama not found, providing mock data for preview UI');
      res.json({
        models: [
          { name: 'phi3:latest', size: 2300000000, modified_at: new Date().toISOString() },
          { name: 'hf.co/LiquidAI/LFM2.5-VL-450M-GGUF:F16', size: 900000000, modified_at: new Date().toISOString() },
          { name: 'minimax-m2.7:cloud', size: 0, modified_at: new Date().toISOString() },
          { name: 'qwen2.5-coder:3b', size: 1900000000, modified_at: new Date().toISOString() },
          { name: 'deepseek-r1:1.5b', size: 1100000000, modified_at: new Date().toISOString() },
          { name: 'mistral:latest', size: 4100000000, modified_at: new Date().toISOString() },
          { name: 'llava:latest', size: 4500000000, modified_at: new Date().toISOString() },
          { name: 'hf.co/TinyLlama/TinyLlama-1.1B-Chat-v0.2-GGUF:Q4_0', size: 700000000, modified_at: new Date().toISOString() },
          { name: 'hf.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF:Q8_0', size: 400000000, modified_at: new Date().toISOString() }
        ]
      });
    }
  });

  app.post('/api/ollama/manage', async (req, res) => {
    const { model, action } = req.body;
    let keep_alive = 0;
    
    if (action === 'preload') keep_alive = -1;
    if (action === 'unload') keep_alive = 0;

    try {
      // Use the generate endpoint with an empty prompt to load/unload
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model,
          prompt: '',
          keep_alive: keep_alive
        })
      });
      
      if (!response.ok) throw new Error(`Ollama action ${action} failed`);
      res.json({ status: 'success', model, action });
    } catch (error) {
      // Mock success for development
      console.log(`Mocking success for ${action} on ${model}`);
      res.json({ status: 'success', model, action, note: 'Mocked for development' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
