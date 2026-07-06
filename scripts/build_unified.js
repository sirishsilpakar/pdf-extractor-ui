import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target platform
const targetPlatform = process.platform;
const platformMap = {
  darwin: "mac",
  win32: "win",
  linux: "linux",
};

const osDirName = platformMap[targetPlatform];
if (!osDirName) {
  console.error(`Unsupported platform for backend compilation: ${targetPlatform}`);
  process.exit(1);
}

// Target folder in UI repo
const FRONTEND_BIN_BACKEND = path.resolve(__dirname, "..", "bin", osDirName, "backend");

// Configuration
const BACKEND_REPO_PATH = process.env.BACKEND_REPO_PATH || "gurung/pdf-extractor";
const GITLAB_HOST = process.env.CI_SERVER_HOST || "gitlab.com";
const CI_TOKEN = process.env.CI_JOB_TOKEN;

// Local adjecent backend directory
const LOCAL_BACKEND_DIR = path.resolve(__dirname, "..", "..", "pdf-extractor");
const CI_BACKEND_DIR = path.resolve(__dirname, "..", "tmp", "pdf-extractor");

let backendDir = "";

function runCommand(cmd, cwd = process.cwd()) {
  console.log(`Running: ${cmd} in ${cwd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

async function main() {
  console.log(`=== Unified Backend Compilation ===`);
  console.log(`Target Platform: ${targetPlatform} (${osDirName})`);

  // 1. Determine which backend directory to use
  if (fs.existsSync(LOCAL_BACKEND_DIR)) {
    console.log(`Detected adjacent local backend repository at: ${LOCAL_BACKEND_DIR}`);
    backendDir = LOCAL_BACKEND_DIR;
  } else {
    console.log(`Adjacent local backend not found. Proceeding to GitLab CI mode...`);

    // Create tmp folder
    const tmpDir = path.resolve(__dirname, "..", "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    if (fs.existsSync(CI_BACKEND_DIR)) {
      console.log(`Found existing cloned backend in temporary directory: ${CI_BACKEND_DIR}`);
    } else {
      let cloneUrl = "";
      if (CI_TOKEN) {
        cloneUrl = `https://gitlab-ci-token:${CI_TOKEN}@${GITLAB_HOST}/${BACKEND_REPO_PATH}.git`;
        console.log(`Cloning backend from GitLab repository using job token...`);
      } else {
        // Fallback for public HTTPS clone
        cloneUrl = `https://${GITLAB_HOST}/${BACKEND_REPO_PATH}.git`;
        console.log(`Cloning backend from GitLab repository (public URL)...`);
      }

      try {
        runCommand(`git clone --depth 1 "${cloneUrl}" "${CI_BACKEND_DIR}"`);
        console.log("Clone successful.");
      } catch (err) {
        console.error(
          "Git clone failed. If this is a private repo, ensure CI_JOB_TOKEN or BACKEND_REPO_PATH is configured correctly.",
        );
        process.exit(1);
      }
    }
    backendDir = CI_BACKEND_DIR;
  }

  // 2. Set up Python environment & run PyInstaller
  try {
    const venvDir = path.join(backendDir, ".venv-ci");

    // Detect the correct python binary name (Linux images may only have python3)
    let systemPython = "python";
    try {
      execSync("python --version", { stdio: "ignore" });
    } catch {
      systemPython = "python3";
    }

    let pythonCmd = systemPython;
    let pipCmd = targetPlatform === "win32" ? "pip" : "pip3";

    console.log(`Setting up Python environment in: ${backendDir}`);

    // Create virtual environment to keep things clean and self-contained
    try {
      if (!fs.existsSync(venvDir)) {
        runCommand(`${systemPython} -m venv "${venvDir}"`, backendDir);
      }

      if (targetPlatform === "win32") {
        pythonCmd = `"${path.join(venvDir, "Scripts", "python.exe")}"`;
        pipCmd = `"${path.join(venvDir, "Scripts", "pip.exe")}"`;
      } else {
        pythonCmd = `"${path.join(venvDir, "bin", "python")}"`;
        pipCmd = `"${path.join(venvDir, "bin", "pip")}"`;
      }
      console.log(`✓ Created Python virtual environment.`);
    } catch (venvErr) {
      console.warn(
        `Failed to create virtual environment (${venvErr.message}). Falling back to global python/pip...`,
      );
    }

    // Install dependencies
    console.log("Installing dependencies...");
    runCommand(`${pipCmd} install -r requirements.txt`, backendDir);
    runCommand(`${pipCmd} install pyinstaller`, backendDir);

    // Build backend
    console.log("Building Python backend executable using PyInstaller...");
    runCommand(`${pythonCmd} build_backend.py`, backendDir);
    console.log("PyInstaller build complete.");

    // 3. Move the compiled backend to frontend bin folder
    const buildOutputSrc = path.join(backendDir, "dist", "pdf-textract-backend");
    const buildOutputDest = path.join(FRONTEND_BIN_BACKEND, "pdf-textract-backend");

    if (!fs.existsSync(buildOutputSrc)) {
      throw new Error(`Compiled backend not found at: ${buildOutputSrc}`);
    }

    // Ensure frontend bin folder exists
    if (!fs.existsSync(FRONTEND_BIN_BACKEND)) {
      fs.mkdirSync(FRONTEND_BIN_BACKEND, { recursive: true });
    }

    // If destination already exists, delete it first to ensure a clean copy
    if (fs.existsSync(buildOutputDest)) {
      console.log(`Cleaning old build at: ${buildOutputDest}`);
      fs.rmSync(buildOutputDest, { recursive: true, force: true });
    }

    console.log(`Copying compiled backend to Electron asset resource folder:`);
    console.log(`  Source: ${buildOutputSrc}`);
    console.log(`  Dest: ${buildOutputDest}`);

    // Use native fs.cpSync (Node 16.7+) for fast, atomic recursive copy
    fs.cpSync(buildOutputSrc, buildOutputDest, { recursive: true });
    console.log(`Backend successfully copied!`);

    // Clean up CI cloned backend to save disk space in GitLab runner
    if (backendDir === CI_BACKEND_DIR) {
      console.log("Cleaning up temporary backend directory...");
      fs.rmSync(CI_BACKEND_DIR, { recursive: true, force: true });
    }

    console.log("\n=== Backend Set Up Complete! ===\n");
  } catch (err) {
    console.error("Failed to compile and package Python backend:", err.message);
    process.exit(1);
  }
}

main();
