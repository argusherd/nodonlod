import { dialog, ipcMain } from "electron";

export default function registerIpcMain() {
  ipcMain.handle("openDir", openDir);
  ipcMain.handle("openFile", openFile);
}

async function openDir() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  return filePaths.at(0);
}

async function openFile() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Media File",
        extensions: [
          "avi",
          "flv",
          "mp3",
          "mp4",
          "mpv",
          "ogg",
          "wav",
          "webm",
          "wmv",
        ],
      },
    ],
  });

  return filePaths.at(0);
}
