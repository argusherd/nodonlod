import cookieParser from "cookie-parser";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import coreExpress from "express";
import { join } from "path";
import neatDuration from "../src/neat-duration";
import chapterRouter from "./chapters";
import electronRouter from "./electron";
import extractionRouter from "./extractions";
import labelRouter from "./labels";
import mediumRouter from "./media/index";
import i18nMiddleware from "./middlewares/i18n";
import pagination from "./middlewares/pagination";
import queryString from "./middlewares/query-string";
import reqExposure from "./middlewares/req-exposure";
import performerRouter from "./performers";
import playQueueRouter from "./play-queues";
import playerRouter from "./player";
import playlistRouter from "./playlists";
import uploaderRouter from "./uploaders";

dayjs.extend(duration);
dayjs.extend(neatDuration);

const express = coreExpress();
const relativePath =
  process.env.NODE_ENV === "test" ? "../views" : "../../views";

express.set("view engine", "pug");
express.use(coreExpress.static("public"));
express.use(coreExpress.urlencoded({ extended: true }));
express.use(cookieParser());
express.use(i18nMiddleware);
express.use(queryString);
express.use(pagination);
express.use(reqExposure);

express.locals.basedir = join(__dirname, relativePath);
express.locals.dayjs = dayjs;

express.get("/", async (_req, res) => {
  res.render("home");
});

express.get("/sidebar", (_req, res) =>
  res.render("_sidebar", { fromBackend: true }),
);

express.use("/extractions", extractionRouter);
express.use("/media", mediumRouter);
express.use("/playlists", playlistRouter);
express.use("/chapters", chapterRouter);
express.use("/play-queues", playQueueRouter);
express.use("/player", playerRouter);
express.use("/electron", electronRouter);
express.use("/uploaders", uploaderRouter);
express.use("/performers", performerRouter);
express.use("/labels", labelRouter);

export default express;
