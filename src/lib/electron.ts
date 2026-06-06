export const electron = {
  isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.electronAPI;
  },

  showInFolder(path: string) {
    if (!this.isAvailable()) return;
    window.electronAPI.showItemInFolder(path);
  },
};
