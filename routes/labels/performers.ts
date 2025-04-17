import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { LabelRequest } from ".";
import Performer from "../../database/models/performer";
import { __ } from "../middlewares/i18n";

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

router.post(
  "/",
  body("name")
    .notEmpty({ ignore_whitespace: true })
    .withMessage(__("The name is missing.")),
  async (req: LabelRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const performer = await Performer.create({
        name: req.body.name,
        thumbnail: req.body.thumbnail || null,
        description: req.body.description || null,
      });

      await req.label.$add("performer", performer);

      res
        .set("HX-Trigger", ["close-modal", "refresh-performers"])
        .sendStatus(201);
    } else
      res.status(422).render("performers/create", {
        basePath: `/labels/${req.label.id}`,
        errors: errors.mapped(),
      });
  },
);

router.get("/create", async (req: LabelRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("performers/create", {
    basePath: `/labels/${req.label.id}`,
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

router.delete("/:performer/confirm", async (req: PerformerRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to remove this performer?"),
    route: `/labels/${req.label.id}/performers/${[req.performer.id]}`,
  });
});

router.delete("/:performer", async (req: PerformerRequest, res) => {
  await req.label.$remove("performer", req.performer);

  res.set("HX-Trigger", "refresh-performers").sendStatus(205);
});

export default router;
