import { app, BrowserWindow } from "electron";
import * as path from "path";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Project Dashboard Prototype",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the built React app
  win.loadFile(path.join(__dirname, "renderer/src/index.html"));
}

app.whenReady().then(createWindow);
