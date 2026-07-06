import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TESS_DIR = path.resolve(__dirname, "../bin/mac/tesseract");
const TESS_EXE = path.join(TESS_DIR, "tesseract");

if (!fs.existsSync(TESS_EXE)) {
  console.error("Could not find tesseract binary at:", TESS_EXE);
  process.exit(1);
}

console.log("Fixing Tesseract binaries in:", TESS_DIR);

const getLibBaseName = (filename) => {
  // Matches e.g. "libsharpyuv" from "libsharpyuv.0.dylib" or "libsharpyuv.0.1.2.dylib"
  const m = filename.match(/^(lib[a-zA-Z0-9_\-]+)/);
  return m ? m[1] : filename;
};

const files = fs.readdirSync(TESS_DIR).filter((f) => f === "tesseract" || f.endsWith(".dylib"));

files.forEach((file) => {
  const filePath = path.join(TESS_DIR, file);
  console.log(`\nProcessing ${file}...`);

  // 1. Change the ID of the library itself to be relative
  if (file.endsWith(".dylib")) {
    try {
      execSync(`install_name_tool -id "@loader_path/${file}" "${filePath}"`);
    } catch (e) {
      console.warn(`  Could not set ID for ${file}`);
    }
  }

  // 2. Find all dependencies and make them relative
  const output = execSync(`otool -L "${filePath}"`).toString();
  const lines = output.split("\n").slice(1); // skip first line (the file path)

  lines.forEach((line) => {
    const match = line.match(/^\t([^\s]+)/);
    if (match) {
      const depPath = match[1];
      const depName = path.basename(depPath);
      const depBase = getLibBaseName(depName);

      // Find if we have a matching local file (comparing base names)
      const matchingFile = files.find((f) => getLibBaseName(f) === depBase);

      if (matchingFile) {
        // If it is a Homebrew/absolute path, OR it is already relative/rpath but needs redirecting
        if (
          depPath.includes("/opt/homebrew/") ||
          depPath.includes("/usr/local/") ||
          depPath.startsWith("@rpath/") ||
          depPath.startsWith("@loader_path/") ||
          files.some((f) => depPath.endsWith(f))
        ) {
          // If the reference path is already exactly what we want, skip it
          if (depPath === `@loader_path/${matchingFile}`) {
            return;
          }

          console.log(`  Updating dependency: ${depName} -> ${matchingFile}`);
          try {
            execSync(
              `install_name_tool -change "${depPath}" "@loader_path/${matchingFile}" "${filePath}"`,
            );
          } catch (e) {
            console.error(`    Failed to update dependency in ${file}: ${e.message}`);
          }
        }
      }
    }
  });
});

console.log("\nDone! All binaries have been patched to use relative paths.");
console.log("You can now rebuild the app and it should run without DYLD_LIBRARY_PATH.");
