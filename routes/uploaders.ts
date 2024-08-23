import { Router } from "express";
import Uploader from "../database/models/uploader";
import { HasPageRequest } from "./middlewares/pagination";

const router = Router();

router.get("/", async (req: HasPageRequest, res) => {
  const { rows: uploaders, count } = await Uploader.findAndCountAll({
    limit: req.perPage,
    offset: Math.max(req.currentPage - 1, 0) * req.perPage,
    order: [["name", "ASC"]],
  });

  res.render("uploaders/index.pug", { uploaders, count });
});

export default router;
