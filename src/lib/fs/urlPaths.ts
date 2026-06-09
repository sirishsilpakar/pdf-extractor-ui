import path from "path";

/**
 * Converts a local filesystem path into a file URL
 * Ensures the path is fully resolved and normalized for use in browser/Electron renderer contexts
 *
 * @param filePath - Absolute or relative filesystem path
 *
 * @returns A 'file://' URL representation of the path
 */
export function pathToFileUrl(filePath: string): string {
  const resolved = path.resolve(filePath);
  return `file://${resolved.replace(/\\/g, "/")}`;
}

/**
 * Converts a 'file://' URL into a local filesystem path
 * Handles cross-platform differences, including Windows drive-letter normalization
 *
 * @param fileUrl - The file URL to convert
 *
 * @returns The corresponding filesystem path
 */
export function fileUrlToPath(fileUrl: string): string {
  return fileUrl.replace("file://", "").replace(/^\/([a-zA-Z]:)/, "$1"); // Windows fix
}
