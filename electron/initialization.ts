import { configDotenv } from "dotenv";
import { app as electron } from "electron";
import coreExpress from "express";
import { copyFileSync } from "fs";
import { constants } from "fs/promises";
import { join } from "path";
import sequelize from "../database/connection";
import express from "../routes";

export function preConfigDotenv() {
  if (!electron.isPackaged) return;

  createEnvFile();
}

export function postConfigDotenv() {
  if (!electron.isPackaged) return;

  setDatabaseLocation();
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
  if (!process.env.SEQUELIZE_STORAGE) return;

  sequelize.options.storage = join(
    electron.getPath("userData"),
    process.env.SEQUELIZE_STORAGE as string,
  );
}
