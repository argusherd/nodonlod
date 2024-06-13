import cookieParser from "cookie-parser";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import coreExpress from "express";
import chapterRouter from "./chapters";
import extractionRouter from "./extractions";
import i18nMiddleware from "./middlewares/i18n";
import playQueueRouter from "./play-queues";
import playableRouter from "./playables";
import playerRouter from "./player";
import playlistRouter from "./playlists";

dayjs.extend(duration);

const express = coreExpress();

express.set("view engine", "pug");
express.use(coreExpress.static("public"));
express.use(coreExpress.urlencoded({ extended: true }));
express.use(cookieParser());
express.use(i18nMiddleware);

express.locals.dayjs = dayjs;

express.get("/", async (_req, res) => {
  res.render("home");
});

express.use("/extractions", extractionRouter);
express.use("/playables", playableRouter);
express.use("/playlists", playlistRouter);
express.use("/chapters", chapterRouter);
express.use("/play-queues", playQueueRouter);
express.use("/player", playerRouter);

export default express;
