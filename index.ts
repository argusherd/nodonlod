import { configDotenv } from "dotenv";
import { BrowserWindow, app as electron } from "electron";
import { gracefulShutdown } from "node-schedule";
import { join } from "path";
import umzug from "./database/migrator";
import Extraction from "./database/models/extraction";
import { postConfigDotenv, preConfigDotenv } from "./electron/initialization";
import registerIpcMain from "./electron/ipc-main-handler";
import "./electron/schedule";
import express from "./routes";
import wss from "./routes/websocket";

preConfigDotenv();
configDotenv();
postConfigDotenv();
registerIpcMain();

const port = process.env.SERVER_PORT || "6869";

express.listen(port).on("upgrade", wss.handleUpgrade);

electron.on("ready", async () => {
  await umzug.up();
  await resetProcessingExtractions();

  const mainWindow = new BrowserWindow({
    webPreferences: { preload: join(__dirname, "electron/preload.js") },
  });
  const openDevTools = parseInt(process.env.OPEN_DEV_TOOLS as string, 10);

  if (openDevTools) mainWindow.webContents.openDevTools();

  mainWindow.loadURL(`http://localhost:${port}`);
});

electron.on("before-quit", async () => {
  await gracefulShutdown();
});

async function resetProcessingExtractions() {
  await Extraction.update({ isProcessing: false }, { where: {} });
}
