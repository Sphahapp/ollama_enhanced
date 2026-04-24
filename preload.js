const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendTerminalInput: (data) => ipcRenderer.send('terminal.send', data),
  onTerminalData: (callback) => ipcRenderer.on('terminal.receive', (event, data) => callback(data)),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  getModels: async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      return await response.json();
    } catch (e) {
      return { models: [] };
    }
  }
});
