import { Router } from "express";
import { Op } from "sequelize";
import { PerformerRequest } from ".";
import Medium from "../../database/models/medium";
import Performer from "../../database/models/performer";
import mediaPlayer from "../../src/media-player";

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
  const { rows: media, count } = await Medium.query({ ...req, ...req.query });

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

router.get("/:medium/play", async (req: MediumRequest, res) => {
  mediaPlayer.play(req.medium.url);

  const nextMedium = await Medium.findOne({
    include: { model: Performer, where: { id: req.performer.id } },
    where: {
      createdAt: { [Op.gte]: req.medium.createdAt },
      id: { [Op.not]: req.medium.id },
    },
    order: ["createdAt"],
  });
  const firstMedium = await Medium.findOne({
    include: { model: Performer, where: { id: req.performer.id } },
    order: ["createdAt"],
  });
  const count = await req.performer.$count("media");
  const randomOffset = Math.floor(Math.random() * count);
  const randomMedium = await Medium.findOne({
    include: { model: Performer, where: { id: req.performer.id } },
    offset: randomOffset,
  });

  res.render("player/show", {
    medium: req.medium,
    from: `/performers/${req.performer.id}/media`,
    first: `/performers/${req.performer.id}/media/${firstMedium?.id}/play`,
    next: nextMedium
      ? `/performers/${req.performer.id}/media/${nextMedium?.id}/play`
      : "",
    random: `/performers/${req.performer.id}/media/${randomMedium?.id}/play`,
  });
});

router.delete("/:medium/confirm", (req: MediumRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: "Are you sure you want to remove this medium?",
    route: `/performers/${req.performer.id}/media/${req.medium.id}`,
  });
});

router.delete("/:medium", async (req: MediumRequest, res) => {
  await req.performer.$remove("medium", req.medium);

  res.set("HX-Trigger", ["close-modal", "refresh-media"]).sendStatus(204);
});

export default router;
