import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { MediumRequest } from ".";
import Label from "../../database/models/label";
import { __ } from "../middlewares/i18n";
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

router.get("/", async (req: MediumRequest, res) => {
  const labels = await req.medium.$get("labels", {
    order: ["category", "text"],
  });

  const template =
    "_list" in req.query ? "media/labels/_list" : "media/labels/index";

  res.render(template, { medium: req.medium, categories: groupLabels(labels) });
});

router.get("/create", (req: MediumRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("media/labels/create", {
    medium: req.medium,
  });
});

router.post(
  "/",
  body("text").notEmpty().withMessage(__("The text is missing.")),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const [label] = await Label.findOrCreate({
        where: { category: req.body.category || null, text: req.body.text },
      });

      await req.medium.$add("label", label);

      res.set("HX-Trigger", ["close-modal", "refresh-labels"]).sendStatus(205);
    } else {
      res.status(422).render("media/labels/create", {
        medium: req.medium,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/add", async (req: MediumRequest, res) => {
  const labels = await Label.findAll({
    order: [
      ["category", "ASC"],
      ["text", "ASC"],
    ],
    ...(req.query.search
      ? {
          where: {
            [Op.or]: [
              { category: { [Op.substring]: req.query.search as string } },
              { text: { [Op.substring]: req.query.search as string } },
            ],
          },
        }
      : {}),
  });

  const template =
    "_list" in req.query ? "media/labels/add/_list" : "media/labels/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    medium: req.medium,
    categories: groupLabels(labels),
  });
});

router.post("/:label", async (req: MediumRequest & LabelRequest, res) => {
  await req.medium.$add("label", req.label);

  res.set("HX-Trigger", ["close-modal", "refresh-labels"]).sendStatus(205);
});

router.delete(
  "/:label/confirm",
  async (req: MediumRequest & LabelRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("_delete", {
      message: __("Are you sure you want to remove this label?"),
      route: `/media/${req.medium.id}/labels/${req.label.id}`,
    });
  },
);

router.delete("/:label", async (req: MediumRequest & LabelRequest, res) => {
  await req.medium.$remove("label", req.label);

  res.set("HX-Trigger", "refresh-labels").sendStatus(205);
});

function groupLabels(labels: Label[]) {
  const categories: Record<string, Label[]> = {};

  labels.forEach((label) => {
    const category = label.category || "";

    if (category in categories === false) categories[category] = [];

    categories[category]?.push(label);
  });

  return categories;
}

export default router;
