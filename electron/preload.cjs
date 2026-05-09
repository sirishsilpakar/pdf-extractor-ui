const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("open-file-dialog"),
  openFolder: () => ipcRenderer.invoke("open-folder-dialog"),
});