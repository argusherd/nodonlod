import { Router } from "express";
import Category from "../database/models/category";
import Label from "../database/models/label";
import Medium from "../database/models/medium";
import Performer from "../database/models/performer";
import PlayQueue from "../database/models/play-queue";
import mediaPlayer from "../src/media-player";
import { i18n } from "./middlewares/i18n";
import { HasPageRequest } from "./middlewares/pagination";
import wss from "./websocket";

interface MediumRequest extends HasPageRequest {
  medium: Medium;
}

interface PerformerRequest extends HasPageRequest {
  performer: Performer;
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
  const { rows: media, count } = await Medium.findAndCountAll({
    limit: req.perPage,
    offset: Math.max(req.currentPage - 1, 0) * req.perPage,
    order: [["createdAt", "DESC"]],
  });

  res.render("media/index", {
    media,
    count,
  });
});

router.get("/:medium", async (req: MediumRequest, res) => {
  const labels = await req.medium.$get("labels", { include: [Category] });
  const categorized: Record<string, Label[]> = {};

  labels.forEach((label) => {
    if (label.category.name in categorized == false)
      categorized[label.category.name] = [];
    categorized[label.category.name]?.push(label);
  });

  res.render("media/show", {
    medium: req.medium,
    uploader: await req.medium.$get("uploader"),
    chapters: await req.medium.$get("chapters"),
    playlists: await req.medium.$get("playlists"),
    categorized,
    performers: await req.medium.$get("performers"),
  });
});

router.get("/:medium/play", (req: MediumRequest, res) => {
  mediaPlayer.play(req.medium.url as string);

  wss.nowPlaying(req.medium);

  res.sendStatus(202);
});

router.post("/:medium/queue", async (req: MediumRequest, res) => {
  await PlayQueue.create({
    mediumId: req.medium.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/:medium/confirm", async (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("_delete", {
      medium: req.medium,
      message: i18n.__("Are you sure you want to delete this medium?"),
      route: `/media/${req.medium.id}`,
    });
});

router.delete("/:medium", async (req: MediumRequest, res) => {
  await req.medium.destroy();

  res.set("HX-Location", "/media").sendStatus(204);
});

router.put(
  "/:medium/performers/:performer",
  async (req: MediumRequest & PerformerRequest, res) => {
    if (await req.medium.$has("performer", req.performer)) {
      await req.medium.$remove("performer", req.performer);
    } else {
      await req.medium.$add("performer", req.performer);
    }

    res.sendStatus(201);
  },
);

export default router;
