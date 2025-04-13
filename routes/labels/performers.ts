import { Router } from "express";
import { Op } from "sequelize";
import { LabelRequest } from ".";
import Performer from "../../database/models/performer";

interface PerformerRequest extends LabelRequest {
  performer: Performer;
}

const router = Router();

router.param("performer", async (req: PerformerRequest, res, next) => {
  const performer = await Performer.findByPk(req.params.performer);

  if (performer) {
    req.performer = performer;
    next();
  } else {
    res.sendStatus(404);
  }
});

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

router.get("/add", async (req: LabelRequest, res) => {
  const { rows: performers, count } = await Performer.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [["name", "ASC"]],
    where: {
      ...(req.query.name && {
        name: { [Op.substring]: req.query.name as string },
      }),
    },
  });

  const template =
    "_list" in req.query ? "performers/add/_list" : "performers/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/labels/${req.label.id}`,
    performers,
    count,
  });
});

router.post("/:performer", async (req: PerformerRequest, res) => {
  await req.label.$add("performer", req.performer);

  res.set("HX-Trigger", ["close-modal", "refresh-performers"]).sendStatus(205);
});

export default router;
