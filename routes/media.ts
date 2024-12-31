import { Router } from "express";
import { body, validationResult } from "express-validator";
import Category from "../database/models/category";
import Label from "../database/models/label";
import Medium from "../database/models/medium";
import Performer from "../database/models/performer";
import PlayQueue from "../database/models/play-queue";
import { play } from "../src/currently-playing";
import { __ } from "./middlewares/i18n";
import { HasPageRequest } from "./middlewares/pagination";

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
    categorized,
    performers: await req.medium.$get("performers"),
  });
});

router.put(
  "/:medium",
  body("title").notEmpty().withMessage(__("The title is missing.")),
  body("url").notEmpty().withMessage(__("The URL is missing.")),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await req.medium.update({
        title: req.body.title,
        url: req.body.url,
        thumbnail: req.body.thumbnail,
        description: req.body.description,
      });

      res.set("HX-Trigger", "medium-saved");
    } else {
      res.set("HX-Trigger", "medium-failed").status(422);
    }

    res.render("media/_info.pug", {
      medium: req.medium,
      uploader: await req.medium.$get("uploader"),
      performers: await req.medium.$get("performers"),
      errors: errors.mapped(),
    });
  },
);

router.get("/:medium/play", async (req: MediumRequest, res) => {
  await play(req.medium);

  res.set("HX-Trigger", "show-playing").sendStatus(202);
});

router.post("/:medium/queue", async (req: MediumRequest, res) => {
  await PlayQueue.create({
    mediumId: req.medium.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/:medium/confirm", async (req: MediumRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete this medium?"),
    route: `/media/${req.medium.id}`,
  });
});

router.delete("/:medium", async (req: MediumRequest, res) => {
  await req.medium.destroy();

  res.set("HX-Location", "/media").sendStatus(204);
});

router.get("/:medium/playlists", async (req: MediumRequest, res) => {
  res.render("media/playlists/index", {
    medium: req.medium,
    playlists: await req.medium.$get("playlists"),
  });
});

router.get(
  "/:medium/performers",
  async (req: MediumRequest & HasPageRequest, res) => {
    const { rows: performers, count } = await Performer.findAndCountAll({
      limit: req.perPage,
      offset: Math.max(req.currentPage - 1, 0) * req.perPage,
      order: [["name", "ASC"]],
    });

    res.set("HX-Trigger", "open-modal").render("media/performers/index", {
      medium: req.medium,
      performers,
      count,
    });
  },
);

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
