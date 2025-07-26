import { Router } from "express";
import { Op } from "sequelize";
import { LabelRequest } from ".";
import Label from "../../database/models/label";
import Medium from "../../database/models/medium";
import mediaPlayer from "../../src/media-player";

interface MediumRequest extends LabelRequest {
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

router.get("/", async (req: LabelRequest, res) => {
  const media = await req.label.$get("media");
  const template =
    "_list" in req.query ? "labels/media/_list" : "labels/media/index";

  res.render(template, { label: req.label, media });
});

router.get("/add", async (req: LabelRequest, res) => {
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
    basePath: `/labels/${req.label.id}`,
    media,
    count,
  });
});

router.post("/:medium", async (req: MediumRequest, res) => {
  await req.label.$add("medium", req.medium);

  res.set("HX-Trigger", ["close-modal", "refresh-media"]).sendStatus(205);
});

router.get("/:medium/play", async (req: MediumRequest, res) => {
  mediaPlayer.play(req.medium.url);

  const nextMedium = await Medium.findOne({
    include: { model: Label, required: true, where: { id: req.label.id } },
    where: {
      title: { [Op.gte]: req.medium.title },
      id: { [Op.not]: req.medium.id },
    },
    order: ["title"],
  });
  const firstMedium = await Medium.findOne({
    include: { model: Label, required: true, where: { id: req.label.id } },
    order: ["title"],
  });
  const count = await req.label.$count("media");
  const randomOffset = Math.floor(Math.random() * count);
  const randomMedium = await Medium.findOne({
    include: { model: Label, required: true, where: { id: req.label.id } },
    offset: randomOffset,
  });

  res.render("player/show", {
    medium: req.medium,
    from: `/labels/${req.label.id}/media`,
    first: `/labels/${req.label.id}/media/${firstMedium?.id}/play`,
    next: nextMedium
      ? `/labels/${req.label.id}/media/${nextMedium?.id}/play`
      : "",
    random: `/labels/${req.label.id}/media/${randomMedium?.id}/play`,
  });
});

router.delete("/:medium/confirm", (req: MediumRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: "Are you sure you want to remove this medium?",
    route: `/labels/${req.label.id}/media/${req.medium.id}`,
  });
});

router.delete("/:medium", async (req: MediumRequest, res) => {
  await req.label.$remove("medium", req.medium);

  res.set("HX-Trigger", ["close-modal", "refresh-media"]).sendStatus(204);
});

export default router;
