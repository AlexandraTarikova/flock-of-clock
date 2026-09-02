const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clocks', {
  get: () => ipcRenderer.invoke('clocks:get'),
});
