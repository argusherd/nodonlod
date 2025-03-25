import { Router } from "express";
import Label from "../../database/models/label";

const router = Router();

router.get("/", async (_req, res) => {
  const { rows: labels, count } = await Label.findAndCountAll({
    order: ["text"],
  });

  res.render("labels/index", { labels, count });
});

export default router;
