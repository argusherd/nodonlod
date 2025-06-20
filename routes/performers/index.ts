import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Performer from "../../database/models/performer";
import { __ } from "../middlewares/i18n";
import { HasPageRequest } from "../middlewares/pagination";
import labelRouter from "./labels";
import mediumRouter from "./media";
import playlistRouter from "./playlists";

export interface PerformerRequest extends HasPageRequest {
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

router.get("/", async (req: HasPageRequest, res) => {
  const querySort = req.query.sort as string;
  const querySortBy = req.query.sortBy as string;
  const supportedSort = ["createdAt", "name", "rating"];
  const sort = supportedSort.includes(querySort) ? querySort : "createdAt";
  const sortBy = ["asc", "desc"].includes(querySortBy) ? querySortBy : "desc";

  const { rows: performers, count } = await Performer.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [[sort, sortBy]],
    where: {
      ...(req.query.search && {
        [Op.or]: [
          { name: { [Op.substring]: req.query.search } },
          { description: { [Op.substring]: req.query.search } },
        ],
      }),
    },
  });

  res.render("performers/index", { count, performers });
});

router.get("/create", (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("performers/create");
});

router.post(
  "/",
  body("name").notEmpty().withMessage(__("The name is missing.")),
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const performer = await Performer.create({ name: req.body.name });

      res.set("HX-Location", `/performers/${performer.id}`).sendStatus(201);
    } else
      res.status(422).render("performers/create", { errors: errors.mapped() });
  },
);

router.get("/:performer", async (req: PerformerRequest, res) => {
  res.render("performers/show", { performer: req.performer });
});

router.put(
  "/:performer",
  body("name").notEmpty().withMessage(__("The name is missing.")),
  async (req: PerformerRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await req.performer.update({
        name: req.body.name,
        thumbnail: req.body.thumbnail,
        description: req.body.description,
      });

      res
        .set("HX-Trigger", "data-saved")
        .render("performers/_info", { performer: req.performer });
    } else
      res
        .status(422)
        .set("HX-Trigger", "data-failed")
        .render("performers/_info", {
          performer: req.performer,
          errors: errors.mapped(),
        });
  },
);

router.put(
  "/:performer/rating",
  body("rating").isInt({ min: 1, max: 5 }).optional(),
  async (req: PerformerRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await req.performer.update({ rating: req.body.rating || null });

      res.sendStatus(204);
    } else res.sendStatus(422);
  },
);

router.delete("/:performer/confirm", (req: PerformerRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete this performer?"),
    route: `/performers/${req.performer.id}`,
  });
});

router.delete("/:performer", async (req: PerformerRequest, res) => {
  await req.performer.destroy();

  res.set("HX-Location", "/performers").sendStatus(204);
});

router.use("/:performer/labels", labelRouter);
router.use("/:performer/media", mediumRouter);
router.use("/:performer/playlists", playlistRouter);

export default router;
