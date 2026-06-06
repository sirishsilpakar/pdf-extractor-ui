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

  window.electronAPI.showItemInFolder(filePath);
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

/**
 * Opens a native folder selection dialog and returns the selected folder path
 * Requires Electron environment; returns `undefined` if unavailable
 *
 * @returns A promise resolving to the selected folder path, or `undefined` if Electron is not available
 */
export async function openFolder(): Promise<string | undefined> {
  if (!isElectronAvailable()) return;

  return window.electronAPI.openFolder();
}

/**
 * Opens a native file picker dialog and returns the selected file path
 * Requires Electron environment; returns `undefined` if Electron is not available
 *
 * @returns A promise resolving to the selected file path, or `undefined` if Electron is not available
 */
export async function openFile(): Promise<string | undefined> {
  if (!isElectronAvailable()) return;

  return window.electronAPI.openFile();
}
