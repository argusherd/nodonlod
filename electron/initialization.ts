import { configDotenv } from "dotenv";
import { BrowserWindow, app as electron } from "electron";
import coreExpress from "express";
import { copyFileSync } from "fs";
import { constants } from "fs/promises";
import { join } from "path";
import sequelize from "../database/connection";
import umzug from "../database/migrator";
import express from "../routes";
import wss from "../routes/websocket";
import mediaPlayer from "../src/media-player";

export function preConfigDotenv() {
  configDotenv();

  if (!electron.isPackaged) return;

  createEnvFile();
}

export function postConfigDotenv() {
  setDatabaseLocation();
  setDatabaseLogging();
  setUpMediaEvent();

  if (!electron.isPackaged) return;

  express.use(coreExpress.static(join(electron.getAppPath(), "public")));
  express.set("views", join(electron.getAppPath(), "views"));
}

function createEnvFile() {
  const productionEnv = join(electron.getPath("userData"), ".env");

  try {
    copyFileSync(
      join(process.cwd(), ".env.example"),
      productionEnv,
      constants.COPYFILE_EXCL,
    );
  } catch (error) {}

  configDotenv({ path: productionEnv });
}

function setDatabaseLocation() {
  if (
    !process.env.SEQUELIZE_STORAGE ||
    process.env.SEQUELIZE_STORAGE === ":memory:"
  )
    return;

  sequelize.options.storage = join(
    electron.isPackaged ? electron.getPath("userData") : process.cwd(),
    process.env.SEQUELIZE_STORAGE as string,
  );
}

export function setDatabaseLogging() {
  if (process.env.SEQUELIZE_LOGGING)
    sequelize.options.logging =
      process.env.SEQUELIZE_LOGGING === "1" ? console.log : false;

  if (process.env.UMZUG_MIGRATOR_LOGGING)
    umzug.options.logger =
      process.env.UMZUG_MIGRATOR_LOGGING === "1" ? console : undefined;
}

function setUpMediaEvent() {
  mediaPlayer.on("start", (duration) => {
    wss.json({ duration });
    wss.json({ event: "track-started" });
    wss.json({ event: "refresh-play-queues" });
  });
  mediaPlayer.on("end", () => wss.json({ event: "track-ended" }));
  mediaPlayer.on("stop", () => wss.json({ event: "track-stopped" }));
  mediaPlayer.on("error", (message) =>
    wss.json({ event: "track-error", data: message }),
  );
  mediaPlayer.on("current-time", (currentTime) => wss.json({ currentTime }));
  mediaPlayer.on("volume", (volume) => wss.json({ volume }));
  mediaPlayer.on("mute", (mute) => wss.json({ mute }));
}

export async function onDevWatch() {
  if (electron.isPackaged) return;

  const chokidar = await import("chokidar");
  const watcher = chokidar.watch("{public,views}/**");

  watcher.on("all", () => {
    BrowserWindow.getAllWindows().forEach((window) =>
      window.webContents.reloadIgnoringCache(),
    );
  });
}
