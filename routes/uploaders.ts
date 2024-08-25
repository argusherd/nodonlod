import { Router } from "express";
import { col, fn } from "sequelize";
import Medium from "../database/models/medium";
import Uploader from "../database/models/uploader";
import { HasPageRequest } from "./middlewares/pagination";

interface UploaderRequest extends HasPageRequest {
  uploader: Uploader;
}

const router = Router();

router.param("uploader", async (req: UploaderRequest, res, next) => {
  const uploader = await Uploader.findOne({
    where: { id: req.params.uploader },
  });

  if (uploader) {
    req.uploader = uploader;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: HasPageRequest, res) => {
  const uploaders = await Uploader.findAll({
    limit: req.perPage,
    offset: Math.max(req.currentPage - 1, 0) * req.perPage,
    order: [["name", "ASC"]],
    attributes: {
      include: [[fn("COUNT", col("media.id")), "mediaCount"]],
    },
    include: [{ model: Medium, attributes: [] }],
    subQuery: false,
    group: "Uploader.id",
  });
  const count = await Uploader.count();

  res.render("uploaders/index.pug", { uploaders, count });
});

router.get("/:uploader", async (req: UploaderRequest, res) => {
  const { rows: media, count } = await Medium.findAndCountAll({
    limit: req.perPage,
    offset: (req.currentPage - 1) * req.perPage,
    order: [["uploadDate", "DESC"]],
    where: { uploaderId: req.uploader.id },
  });

  res.render("uploaders/show.pug", {
    uploader: req.uploader,
    media,
    count,
  });
});

export default router;
