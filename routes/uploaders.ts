import { Router } from "express";
import { col, fn } from "sequelize";
import Medium from "../database/models/medium";
import Uploader from "../database/models/uploader";
import { HasPageRequest } from "./middlewares/pagination";

const router = Router();

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

export default router;
