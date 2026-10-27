const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopControls', Object.freeze({
  openAdmin: () => ipcRenderer.send('desktop:open-admin'),
  returnToGame: () => ipcRenderer.send('desktop:return-to-game'),
}));
