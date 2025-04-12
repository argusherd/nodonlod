import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { MediumRequest } from ".";
import Performer from "../../database/models/performer";
import { __ } from "../middlewares/i18n";
import { HasPageRequest } from "../middlewares/pagination";

interface PerformerRequest extends HasPageRequest {
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

router.get("/", async (req: MediumRequest, res) => {
  res.render("media/performers/index", {
    medium: req.medium,
    performers: await req.medium.$get("performers", {
      order: [["name", "ASC"]],
    }),
  });
});

router.post(
  "/",
  body("name")
    .notEmpty({ ignore_whitespace: true })
    .withMessage(__("The name is missing.")),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const performer = await Performer.create({ name: req.body.name });

      await req.medium.$add("performer", performer);

      res
        .set("HX-Trigger", ["close-modal", "refresh-performers"])
        .sendStatus(201);
    } else
      res.status(422).render("performers/create", {
        basePath: `/media/${req.medium.id}`,
        errors: errors.mapped(),
      });
  },
);

router.get("/create", async (req: MediumRequest & HasPageRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("performers/create", {
    basePath: `/media/${req.medium.id}`,
  });
});

router.get("/add", async (req: MediumRequest & HasPageRequest, res) => {
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
    basePath: `/media/${req.medium.id}`,
    performers,
    count,
  });
});

router.post(
  "/:performer",
  async (req: MediumRequest & PerformerRequest, res) => {
    await req.medium.$add("performer", req.performer);

    res
      .set("HX-Trigger", ["close-modal", "refresh-performers"])
      .sendStatus(205);
  },
);

router.delete(
  "/:performer/confirm",
  async (req: MediumRequest & PerformerRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("_delete", {
      message: __("Are you sure you want to remove this performer?"),
      route: `/media/${req.medium.id}/performers/${[req.performer.id]}`,
    });
  },
);

router.delete(
  "/:performer",
  async (req: MediumRequest & PerformerRequest, res) => {
    await req.medium.$remove("performer", req.performer);

    res.set("HX-Trigger", "refresh-performers").sendStatus(205);
  },
);

export default router;
