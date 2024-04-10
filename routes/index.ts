import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import coreExpress from "express";
import extractionRouter from "./extractions";
import playableRouter from "./playables";

dayjs.extend(duration);

const express = coreExpress();

express.set("view engine", "pug");
express.use(coreExpress.static("public"));
express.use(coreExpress.urlencoded({ extended: true }));

express.locals.dayjs = dayjs;

express.get("/", async (_req, res) => {
  res.render("home");
});

express.use("/extractions", extractionRouter);
express.use("/playables", playableRouter);

export default express;
