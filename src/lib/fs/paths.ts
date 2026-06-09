import path from "path";

/**
 * Removes any trailing path separators (`/` or `\`) from the provided path
 *
 * @param input - The path string to clean
 *
 * @returns The path without trailing separators
 */
export function trimTrailingSeparators(input: string): string {
  return input.replace(/[\\/]+$/, "");
}

/**
 * Joins path segments using the current operating system's path separator
 *
 * @param parts - Path segments to combine
 *
 * @returns A correctly joined path
 */
export function joinPath(...parts: string[]): string {
  return path.join(...parts);
}

/**
 * Normalizes a path by resolving mixed separators and redundant segments
 *
 * @param input - The path to normalize
 *
 * @returns The normalized path in OS-specific format
 */
export function normalizePath(input: string): string {
  return path.normalize(input);
}

/**
 * Ensures the specified child directory exists at the end of a parent path
 * If the parent already ends with the child directory name, the original
 * cleaned path is returned
 *
 * @param parent - The parent directory path
 * @param child - The child directory name to ensure
 *
 * @returns A path ending with the specified child directory
 */
export function ensureChildDir(parent: string, child: string): string {
  const cleanParent = trimTrailingSeparators(parent);

  if (cleanParent.endsWith(child)) {
    return cleanParent;
  }

  return path.join(cleanParent, child);
}
