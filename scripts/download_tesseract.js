import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stable pre-compiled portable binaries
// Linux: Statically compiled raw binary (requires no extraction)
const TESSERACT_LINUX_URL =
  process.env.TESSERACT_LINUX_URL ||
  "https://github.com/DanielMYT/tesseract-static/releases/download/tesseract-5.5.2/tesseract.x86_64";

// Windows: Official UB Mannheim installer (run silently to place files)
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
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Case 1: Windows Setup Installer Executable
  if (filePath.endsWith(".exe")) {
    console.log(`Running silent background installer for Windows to: ${destDir}`);
    execSync(`"${filePath}" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /DIR="${destDir}"`, {
      stdio: "inherit",
    });

    // Clean up installer residual logs so they aren't bundled into the Electron app
    try {
      const uninsFile = path.join(destDir, "unins000.exe");
      const uninsDat = path.join(destDir, "unins000.dat");
      if (fs.existsSync(uninsFile)) fs.unlinkSync(uninsFile);
      if (fs.existsSync(uninsDat)) fs.unlinkSync(uninsDat);
    } catch (_) {}
    console.log("Silent installation complete.");
    return;
  }

  // Case 2: Linux Static Raw Executable
  if (filePath.endsWith(".x86_64") || filePath.endsWith("tesseract")) {
    console.log(`Placing raw static binary file for Linux...`);
    const targetBin = path.join(destDir, "tesseract");
    fs.copyFileSync(filePath, targetBin);
    console.log("Binary placement complete.");
    return;
  }

  // Case 3: Standard Compressed Archives Fallback
  console.log(`Extracting archive to ${destDir}...`);
  const isZip = filePath.endsWith(".zip");

  if (process.platform === "win32") {
    if (isZip) {
      execSync(
        `powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${destDir}' -Force"`,
      );
    } else {
      execSync(`tar -xzf "${filePath}" -C "${destDir}"`);
    }
  } else {
    if (isZip) {
      execSync(`unzip -o "${filePath}" -d "${destDir}"`);
    } else {
      execSync(`tar -xzf "${filePath}" -C "${destDir}"`);
    }
  }
  console.log("Extraction complete.");
}

async function main() {
  console.log(`=== Tesseract Binary Installer ===`);
  console.log(`Target Platform: ${targetPlatform} (${osDirName})`);
  console.log(`Destination Directory: ${DEST_DIR}`);

  // Create temporary workspace directory
  const tmpDir = path.resolve(__dirname, "..", "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  let downloadUrl = "";
  let archiveName = "";

  if (targetPlatform === "win32") {
    downloadUrl = TESSERACT_WIN_URL;
    archiveName = "tesseract-setup.exe";
  } else if (targetPlatform === "linux") {
    downloadUrl = TESSERACT_LINUX_URL;
    archiveName = "tesseract.x86_64";
  } else {
    console.log(
      "For macOS, Tesseract binaries should be prepared via package:mac workflows (Homebrew binaries compiled locally). Skipping download.",
    );
    process.exit(0);
  }

  const archivePath = path.join(tmpDir, archiveName);

  try {
    if (fs.existsSync(archivePath)) {
      console.log(`Temporary dependency ${archiveName} already exists, skipping download.`);
    } else {
      await downloadFile(downloadUrl, archivePath);
      console.log("Successfully downloaded.");
    }

    // Unpack / Install
    extractArchive(archivePath, DEST_DIR);

    // Clean up temporary workspace downloads
    try {
      fs.unlinkSync(archivePath);
    } catch (_) {}

    // Verify binary exists and set permissions
    const exeName = targetPlatform === "win32" ? "tesseract.exe" : "tesseract";
    let binPath = path.join(DEST_DIR, exeName);

    // Handle structural nested variations safely
    if (fs.existsSync(DEST_DIR)) {
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
