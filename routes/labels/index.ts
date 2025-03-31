import { Router } from "express";
import Label from "../../database/models/label";
import { HasPageRequest } from "../middlewares/pagination";

interface LabelRequest extends HasPageRequest {
  label: Label;
}

const router = Router();

router.param("label", async (req: LabelRequest, res, next) => {
  const label = await Label.findByPk(req.params.label);

  if (label) {
    req.label = label;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (_req, res) => {
  const { rows: labels, count } = await Label.findAndCountAll({
    order: ["text"],
  });

  res.render("labels/index", { labels, count });
});

router.get("/:label", (req: LabelRequest, res) => {
  res.render("labels/show", { label: req.label });
});

export default router;
