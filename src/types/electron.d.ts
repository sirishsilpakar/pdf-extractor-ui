export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string>;
      openFolder: () => Promise<string>;
    };
  }
}