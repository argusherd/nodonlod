import { Router } from "express";
import { LabelRequest } from ".";

const router = Router();

router.get("/", async (req: LabelRequest, res) => {
  const template =
    "_list" in req.query
      ? "labels/performers/_list"
      : "labels/performers/index";

  res.render(template, {
    label: req.label,
    performers: await req.label.$get("performers"),
  });
});

export default router;
