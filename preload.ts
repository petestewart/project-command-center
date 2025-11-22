import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  openPath: (filePath: string) => ipcRenderer.invoke("open-path", filePath),
  createMarkdownFile: (fileName: string, content: string) =>
    ipcRenderer.invoke("create-markdown-file", fileName, content),
  fetchPageTitle: (url: string) => ipcRenderer.invoke("fetch-page-title", url),
});
