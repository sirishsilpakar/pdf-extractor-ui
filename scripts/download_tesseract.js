import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stable pre-compiled portable binaries
// Linux: statically compiled build from mugwort-solutions/tesseract-static GitHub releases
const TESSERACT_LINUX_URL =
  process.env.TESSERACT_LINUX_URL ||
  "https://github.com/DanielMYT/tesseract-static/releases/download/tesseract-5.5.2/tesseract.x86_64";
// Windows: Official UB Mannheim portable build (64-bit, includes tesseract.exe + DLLs)
const TESSERACT_WIN_URL =
  process.env.TESSERACT_WIN_URL ||
  "https://github.com/UB-Mannheim/tesseract/releases/download/v5.4.0.20240606/tesseract-ocr-w64-setup-5.4.0.20240606.exe";

// Parse command line arguments
const args = process.argv.slice(2);
let targetPlatform = process.platform; // default to host platform

args.forEach((arg) => {
  if (arg.startsWith("--platform=")) {
    targetPlatform = arg.split("=")[1];
  }
});

// Map node platform to bin folder name
const platformMap = {
  darwin: "mac",
  win32: "win",
  linux: "linux",
};

const osDirName = platformMap[targetPlatform];
if (!osDirName) {
  console.error(`Unsupported platform: ${targetPlatform}`);
  process.exit(1);
}

const DEST_DIR = path.resolve(__dirname, "..", "bin", osDirName, "tesseract");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Destroy the current stream before following the redirect
          file.close();
          downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
        file.on("error", (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function extractArchive(filePath, destDir) {
  console.log(`Extracting archive to ${destDir}...`);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const isZip = filePath.endsWith(".zip");

  if (process.platform === "win32") {
    // Windows extraction using PowerShell
    if (isZip) {
      execSync(
        `powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${destDir}' -Force"`,
      );
    } else {
      // Tarball on Windows (requires Windows 10+ built-in tar)
      execSync(`tar -xzf "${filePath}" -C "${destDir}"`);
    }
  } else {
    // macOS / Linux extraction using system command
    if (isZip) {
      execSync(`unzip -o "${filePath}" -d "${destDir}"`);
    } else {
      execSync(`tar -xzf "${filePath}" -C "${destDir}"`);
    }
  }
  console.log("✓ Extraction complete.");
}

async function main() {
  console.log(`=== Tesseract Binary Installer ===`);
  console.log(`Target Platform: ${targetPlatform} (${osDirName})`);
  console.log(`Destination Directory: ${DEST_DIR}`);

  // Create temporary directory
  const tmpDir = path.resolve(__dirname, "..", "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  let downloadUrl = "";
  let archiveName = "";

  if (targetPlatform === "win32") {
    downloadUrl = TESSERACT_WIN_URL;
    archiveName = "tesseract-win64.zip";
  } else if (targetPlatform === "linux") {
    downloadUrl = TESSERACT_LINUX_URL;
    archiveName = "tesseract-linux.tar.gz";
  } else {
    console.log(
      "For macOS, Tesseract binaries should be prepared via package:mac workflows (Homebrew binaries compiled locally). Skipping download.",
    );
    process.exit(0);
  }

  const archivePath = path.join(tmpDir, archiveName);

  try {
    if (fs.existsSync(archivePath)) {
      console.log(`✓ Temporary archive ${archiveName} already exists, skipping download.`);
    } else {
      await downloadFile(downloadUrl, archivePath);
      console.log("✓ Successfully downloaded.");
    }

    // Unpack
    extractArchive(archivePath, DEST_DIR);

    // Clean up temporary archive if requested or needed, but let's keep it clean
    try {
      fs.unlinkSync(archivePath);
    } catch (_) {}

    // Verify binary exists and set permissions
    const exeName = targetPlatform === "win32" ? "tesseract.exe" : "tesseract";
    let binPath = path.join(DEST_DIR, exeName);

    // Some static packages extract into a subfolder, let's check and move files if necessary
    const subdirs = fs.readdirSync(DEST_DIR);
    if (!fs.existsSync(binPath) && subdirs.length === 1) {
      const subDirPath = path.join(DEST_DIR, subdirs[0]);
      if (fs.statSync(subDirPath).isDirectory()) {
        console.log(`Moving files from nested directory ${subdirs[0]} to root...`);
        const files = fs.readdirSync(subDirPath);
        files.forEach((file) => {
          fs.renameSync(path.join(subDirPath, file), path.join(DEST_DIR, file));
        });
        fs.rmdirSync(subDirPath);
      }
    }

    if (fs.existsSync(binPath)) {
      if (targetPlatform !== "win32") {
        fs.chmodSync(binPath, 0o755);
      }
      console.log(`Tesseract binary set up successfully at: ${binPath}`);
    } else {
      console.warn(
        `Warning: Executable not found at ${binPath} after extraction. You may need to verify the archive structure.`,
      );
    }
  } catch (err) {
    console.error("Error installing Tesseract binaries:", err.message);
    process.exit(1);
  }
}

main();
