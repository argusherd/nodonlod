import { configDotenv } from "dotenv";
import { app as electron, BrowserWindow } from "electron";
import umzug from "./database/migrator";
import { postConfigDotenv, preConfigDotenv } from "./electron/initialization";
import express from "./routes";

preConfigDotenv();
configDotenv();
postConfigDotenv();

const port = process.env.SERVER_PORT || "6869";

express.listen(port);

electron.on("ready", async () => {
  await umzug.up();

  const mainWindow = new BrowserWindow();
  const openDevTools = parseInt(process.env.OPEN_DEV_TOOLS as string, 10);

  if (openDevTools) mainWindow.webContents.openDevTools();

  mainWindow.loadURL(`http://localhost:${port}`);
});
