/*
 * Ollama Ultra Terminal - Electron Main Process
 */

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const pty = require('node-pty');
const os = require('os');

let mainWindow;
let ollamaProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0c0c0c',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In production, load the built index.html
  // In development, load from localhost:3000
  const isDev = process.env.NODE_ENV === 'development';
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'dist/index.html')}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (ollamaProcess) ollamaProcess.kill();
  });
}

// Spawn Ollama as a managed subprocess
function startOllama() {
  const env = { 
    ...process.env, 
    OLLAMA_ORIGINS: '*',
    OLLAMA_KEEP_ALIVE: '-1',
    OLLAMA_NUM_PARALLEL: '1',
    OLLAMA_KV_CACHE_TYPE: 'q4_0'
  };

  ollamaProcess = spawn('ollama', ['serve'], { env });

  ollamaProcess.stdout.on('data', (data) => console.log(`Ollama: ${data}`));
  ollamaProcess.stderr.on('data', (data) => console.error(`Ollama Error: ${data}`));
}

app.whenReady().then(() => {
  startOllama();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Terminal Backend with node-pty
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env
});

ipcMain.on('terminal.send', (event, data) => {
  ptyProcess.write(data);
});

ptyProcess.onData((data) => {
  if (mainWindow) mainWindow.webContents.send('terminal.receive', data);
});

// Context Menu
ipcMain.on('show-context-menu', (event) => {
  const template = [
    { label: 'Copy', role: 'copy' },
    { label: 'Paste', role: 'paste' },
    { type: 'separator' },
    { label: 'Select All', role: 'selectAll' }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});
