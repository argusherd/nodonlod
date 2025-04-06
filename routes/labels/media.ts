import { Router } from "express";
import { LabelRequest } from ".";

const router = Router();

router.get("/", async (req: LabelRequest, res) => {
  const media = await req.label.$get("media");
  const template =
    "_list" in req.query ? "labels/media/_list" : "labels/media/index";

  res.render(template, { label: req.label, media });
});

export default router;
