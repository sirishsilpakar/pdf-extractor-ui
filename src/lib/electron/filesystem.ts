import { normalizePath } from "../fs/paths";

/**
 * Returns whether Electron APIs are available in the current runtime
 *
 * @returns 'true if the Electron preload API is exposed on the 'window' object; otherwise 'false'
 */
export function isElectronAvailable(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

/**
 * Opens the operating system's file explorer and reveals the specified file or folder
 * Does nothing when Electron is unavailable
 *
 * @param filePath - The path to reveal in the file explorer
 */
export function showInFolder(filePath: string) {
  if (!isElectronAvailable()) return;

  window.electronAPI.showItemInFolder(normalizePath(filePath));
}

/**
 * Opens the specified file, directory, or URL using the operating system's default handler
 * Does nothing when Electron is unavailable
 *
 * @param path - The path or URL to open
 */
export function openPath(path: string) {
  if (!isElectronAvailable()) return;

  window.electronAPI.openPath(path);
}
