export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string>;
      openFolder: () => Promise<string>;
      openPath: (path: string) => Promise<void>;
      showItemInFolder: (path: string) => Promise<void>;
    };
  }
}