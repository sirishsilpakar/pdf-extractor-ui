const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("open-file-dialog"),
  openFolder: () => ipcRenderer.invoke("open-folder-dialog"),
  openPath: (path) => ipcRenderer.invoke("open-path", path),
  showItemInFolder: (path) => ipcRenderer.invoke("show-item-in-folder", path),
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),
});