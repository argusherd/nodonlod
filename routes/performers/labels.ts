import { Router } from "express";
import { PerformerRequest } from ".";

const router = Router();

router.get("/", async (req: PerformerRequest, res) => {
  const labels = await req.performer.$get("labels", {
    order: ["category", "text"],
  });

  const template =
    "_list" in req.query ? "labels/_list" : "performers/labels/index";

  res.render(template, {
    performer: req.performer,
    basePath: `/performers/${req.performer.id}`,
    labels,
  });
});

export default router;
