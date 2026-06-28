import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ipcMain, dialog, shell } from "electron";

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
  return result.filePaths[0];
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.whenReady().then(createWindow);
