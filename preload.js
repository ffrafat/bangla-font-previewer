const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFontFolder: () => ipcRenderer.invoke('select-font-folder'),
  readFontFiles: (folderPath) => ipcRenderer.invoke('read-font-files', folderPath),
  getSavedFontFolder: () => ipcRenderer.invoke('get-saved-font-folder'),

  // Listen to folder update from menu
  onFontFolderUpdated: (callback) => ipcRenderer.on('font-folder-updated', (event, path) => {
    callback(path);
  })
});
