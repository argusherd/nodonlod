import { exec } from "child_process";
import { dialog, app as electron } from "electron";
import { Router } from "express";

const router = Router();

router.get("/file", async (_req, res) => {
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

  res.render("extractions/_input-url.pug", { url: filePaths.at(0) });
});

router.get("/directory", async (_req, res) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  res.render("extractions/_input-url.pug", { url: filePaths.at(0) });
});

router.get("/user-data", async (_req, res) => {
  exec(`start "" "${electron.getPath("userData")}"`);

  res.sendStatus(200);
});

export default router;
