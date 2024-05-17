import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openDir: () => ipcRenderer.invoke("openDir"),
  openFile: () => ipcRenderer.invoke("openFile"),
});
