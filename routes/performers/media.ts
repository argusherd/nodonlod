import { Router } from "express";
import { Op } from "sequelize";
import { PerformerRequest } from ".";
import Medium from "../../database/models/medium";

interface MediumRequest extends PerformerRequest {
  medium: Medium;
}

const router = Router();

router.param("medium", async (req: MediumRequest, res, next) => {
  const medium = await Medium.findByPk(req.params.medium);

  if (medium) {
    req.medium = medium;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: PerformerRequest, res) => {
  const template =
    "_list" in req.query ? "performers/media/_list" : "performers/media/index";

  res.render(template, {
    performer: req.performer,
    media: await req.performer.$get("media"),
  });
});

router.get("/add", async (req: PerformerRequest, res) => {
  const { rows: media, count } = await Medium.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [["title", "ASC"]],
    where: {
      ...(req.query.search && {
        title: { [Op.substring]: req.query.search as string },
      }),
    },
  });

  const template = "_list" in req.query ? "media/add/_list" : "media/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/performers/${req.performer.id}`,
    media,
    count,
  });
});

router.post("/:medium", async (req: MediumRequest, res) => {
  await req.performer.$add("medium", req.medium);

  res.set("HX-Trigger", ["close-modal", "refresh-media"]).sendStatus(205);
});

export default router;
