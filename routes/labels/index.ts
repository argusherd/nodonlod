import { Router } from "express";
import { body, validationResult } from "express-validator";
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

router.get("/create", (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("labels/create");
});

router.post(
  "/",
  body("text")
    .notEmpty({ ignore_whitespace: true })
    .withMessage("The text is missing."),
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const [label] = await Label.findOrCreate({
        where: {
          category: req.body.category || null,
          text: req.body.text,
        },
      });

      res.set("HX-Location", `/labels/${label.id}`).sendStatus(201);
    } else res.status(422).render("labels/create", { errors: errors.mapped() });
  },
);

router.get("/:label", (req: LabelRequest, res) => {
  res.render("labels/show", { label: req.label });
});

export default router;
