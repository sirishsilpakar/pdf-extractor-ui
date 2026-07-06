import { app, BrowserWindow } from "electron";

// Prevent macOS from prompting for Keychain Access/Safe Storage for unsigned apps
if (process.platform === "darwin") {
  app.commandLine.appendSwitch("password-store", "basic")
  app.commandLine.appendSwitch("use-mock-keychain")
}

import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { ipcMain, dialog, shell } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPortFilePath() {
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
  if (isDev) {
    // Check backend directory: repo/pdf-extractor/port.json
    const portFilePath = path.join(__dirname, "../pdf-extractor/port.json");
    if (fs.existsSync(portFilePath)) {
      return portFilePath;
    }
    // Fallback: Check UI project root
    return path.join(__dirname, "./port.json");
  } else {
    // Production: ~/.pdf-extractor/port.json
    return path.join(os.homedir(), ".pdf-extractor", "port.json");
  }
}

ipcMain.handle("open-file-dialog", async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  const result = await dialog.showOpenDialog(focusedWindow, {
    properties: ["openFile"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    modal: true
  });
  return result.filePaths[0];
});

ipcMain.handle("open-folder-dialog", async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  const result = await dialog.showOpenDialog(focusedWindow, {
    properties: ["openDirectory"],
    modal: true
  });
  return result.filePaths[0]
});

ipcMain.handle("open-path", async (event, folderPath) => {
  if (folderPath) {
    await shell.openPath(folderPath);
  }
});

ipcMain.handle("show-item-in-folder", async (event, filePath) => {
  if (filePath) {
    shell.showItemInFolder(path.normalize(filePath));
  }
});

ipcMain.handle("get-backend-port", async () => {
  const portFilePath = getPortFilePath();
  try {
    if (fs.existsSync(portFilePath)) {
      const data = fs.readFileSync(portFilePath, "utf8");
      const config = JSON.parse(data);
      return config.port;
    }
  } catch (err) {
    console.error("Error reading port.json:", err);
  }
  return null;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "../assets/icon.png"),
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

let backendProcess = null

function startBackend() {
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

  // Base directory for extraction data
  const baseDir = app.getPath("userData")

  let backendPath
  let tesseractPath
  let tessdataPath

  if (isDev) {
    const osDir =
      process.platform === "darwin" ? "mac" : process.platform === "win32" ? "win" : "linux"
    const exeName =
      process.platform === "win32" ? "pdf-textract-backend.exe" : "pdf-textract-backend"
    backendPath = path.join(
      __dirname,
      "..",
      "bin",
      osDir,
      "backend",
      "pdf-textract-backend",
      exeName,
    )
    tesseractPath = path.join(
      __dirname,
      "..",
      "bin",
      osDir,
      "tesseract",
      process.platform === "win32" ? "tesseract.exe" : "tesseract",
    )
    tessdataPath = path.join(__dirname, "..", "bin", "tessdata")
  } else {
    const exeName =
      process.platform === "win32" ? "pdf-textract-backend.exe" : "pdf-textract-backend"
    backendPath = path.join(
      process.resourcesPath,
      "bin",
      "backend",
      "pdf-textract-backend",
      exeName,
    )
    tesseractPath = path.join(
      process.resourcesPath,
      "bin",
      "tesseract",
      process.platform === "win32" ? "tesseract.exe" : "tesseract",
    )
    tessdataPath = path.join(process.resourcesPath, "bin", "tessdata")
  }

  // Check if backend executable exists
  if (!fs.existsSync(backendPath)) {
    console.error("Backend executable not found at:", backendPath)
    console.error("Make sure to build the Python backend and place it in the bin/ folder!")
    return
  }

  // Fix macOS/Linux execution permissions if bundled
  if (process.platform === "darwin" || process.platform === "linux") {
    try {
      fs.chmodSync(backendPath, 0o755)
      console.log("Set execute permissions for backend.")
    } catch (err) {
      console.error("Failed to set execute permissions for backend:", err)
    }
    try {
      if (fs.existsSync(tesseractPath)) {
        fs.chmodSync(tesseractPath, 0o755)
        console.log("Set execute permissions for tesseract.")
      }
    } catch (err) {
      console.error("Failed to set execute permissions for tesseract:", err)
    }
  }

  console.log("Starting backend...")
  console.log("  Backend Path:", backendPath)
  console.log("  Tesseract Path:", tesseractPath)
  console.log("  Tessdata Path:", tessdataPath)
  console.log("  User Data Dir:", baseDir)

  if (!fs.existsSync(tesseractPath)) {
    console.warn("  WARNING: Tesseract binary not found at expected path!")
  }
  if (!fs.existsSync(tessdataPath)) {
    console.warn("  WARNING: Tessdata directory not found at expected path! OCR will likely fail.")
  }

  const env = {
    ...process.env,
    BASE_DIR: baseDir,
    TESSERACT_CMD: tesseractPath,
    TESSDATA_PREFIX: tessdataPath,
    SERVER_PORT: isDev ? "8080" : "0",
    SERVE_UI: "false", // headless mode
    PORT_FILE_PATH: getPortFilePath(),
  }

  // Add library paths for macOS and Linux to find bundled shared libraries
  if (process.platform === "darwin") {
    const tessDir = path.dirname(tesseractPath)
    env.DYLD_LIBRARY_PATH = [tessDir, process.env.DYLD_LIBRARY_PATH].filter(Boolean).join(":")
    console.log("  DYLD_LIBRARY_PATH:", env.DYLD_LIBRARY_PATH)
  } else if (process.platform === "linux") {
    const tessDir = path.dirname(tesseractPath)
    env.LD_LIBRARY_PATH = [tessDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":")
    console.log("  LD_LIBRARY_PATH:", env.LD_LIBRARY_PATH)
  }

  backendProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    env: env,
  })

  backendProcess.on("error", (err) => {
    const msg = `Failed to start backend: ${err.message}\nPath: ${backendPath}`
    console.error(msg)
    dialog.showErrorBox("Backend Error", msg)
  })

  backendProcess.on("exit", (code, signal) => {
    console.log(`[Backend] Process exited with code ${code} and signal ${signal}`)
    if (code !== 0 && code !== null) {
      dialog.showErrorBox(
        "Backend Process Exited",
        `The backend process stopped unexpectedly (Code: ${code}).\nPlease check the application logs for details.`,
      )
    }
    backendProcess = null
  })

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend] ${data.toString().trim()}`)
  })

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend ERR] ${data.toString().trim()}`)
  })
}

app.on("will-quit", () => {
  if (backendProcess) {
    backendProcess.kill()
  }

  // Clean up port.json file
  const portFilePath = getPortFilePath();
  try {
    if (fs.existsSync(portFilePath)) {
      fs.unlinkSync(portFilePath);
      console.log("Cleaned up port file:", portFilePath);
    }
  } catch (err) {
    console.error("Failed to delete port file on exit:", err);
  }
})

app.whenReady().then(() => {
  const shouldStartBackend =
    process.env.START_BACKEND !== "false" &&
    !process.argv.includes("--no-backend") &&
    !process.argv.includes("--fe-only")
  if (shouldStartBackend) {
    startBackend()
  } else {
    console.log("Backend start skipped (FE-only mode enabled).")
  }
  createWindow()
})
