import { Router } from "express";
import { PerformerRequest } from ".";
import Label from "../../database/models/label";

interface LabelRequest extends PerformerRequest {
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

router.get("/add", async (req: PerformerRequest, res) => {
  const labels = await Label.scope({
    method: ["search", req.query.search],
  }).findAll({
    order: [
      ["category", "ASC"],
      ["text", "ASC"],
    ],
  });

  const template =
    "_list" in req.query ? "labels/add/_list" : "labels/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/performers/${req.performer.id}`,
    labels,
  });
});

router.post("/:label", async (req: LabelRequest, res) => {
  await req.performer.$add("label", req.label);

  res.set("HX-Trigger", ["close-modal", "refresh-labels"]).sendStatus(205);
});

export default router;
