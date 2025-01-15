import cookieParser from "cookie-parser";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import coreExpress from "express";
import { join } from "path";
import neatDuration from "../src/neat-duration";
import categoryRouter from "./categories";
import chapterRouter from "./chapters";
import electronRouter from "./electron";
import extractionRouter from "./extractions";
import mediumRouter from "./media";
import i18nMiddleware from "./middlewares/i18n";
import pagination from "./middlewares/pagination";
import queryString from "./middlewares/query-string";
import reqExposure from "./middlewares/req-exposure";
import performerRouter from "./performers";
import playRouter from "./play";
import playQueueRouter from "./play-queues";
import playerRouter from "./player";
import playlistItemRouter from "./playlist-items";
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
express.use("/", chapterRouter);
express.use("/play-queues", playQueueRouter);
express.use("/player", playerRouter);
express.use("/electron", electronRouter);
express.use("/playlist-items", playlistItemRouter);
express.use("/uploaders", uploaderRouter);
express.use("/performers", performerRouter);
express.use("/play", playRouter);
express.use("/categories", categoryRouter);

export default express;
