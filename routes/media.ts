import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Category from "../database/models/category";
import Label from "../database/models/label";
import Medium from "../database/models/medium";
import Performer from "../database/models/performer";
import PlayQueue from "../database/models/play-queue";
import Playlist from "../database/models/playlist";
import { play } from "../src/currently-playing";
import { __ } from "./middlewares/i18n";
import { HasPageRequest } from "./middlewares/pagination";

interface MediumRequest extends HasPageRequest {
  medium: Medium;
}

interface PlaylistRequest extends HasPageRequest {
  playlist: Playlist;
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

router.param("playlist", async (req: PlaylistRequest, res, next) => {
  const playlist = await Playlist.findByPk(req.params.playlist);

  if (playlist) {
    req.playlist = playlist;
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
    offset: req.offset,
    order: [["createdAt", "DESC"]],
  });

  res.render("media/index", {
    media,
    count,
  });
});

router.get("/:medium", async (req: MediumRequest, res) => {
  res.render("media/show", {
    medium: req.medium,
    uploader: await req.medium.$get("uploader"),
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
  const template =
    "_list" in req.query ? "media/playlists/_list" : "media/playlists/index";

  res.render(template, {
    medium: req.medium,
    playlists: await req.medium.$get("playlists"),
  });
});

router.post(
  "/:medium/playlists",
  body("title")
    .notEmpty({ ignore_whitespace: true })
    .withMessage("The title is missing."),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const playlist = await Playlist.create({ title: req.body.title });

      await req.medium.$add("playlist", playlist);

      res
        .set("HX-Trigger", ["close-modal", "refresh-playlists"])
        .sendStatus(205);
    } else {
      res.status(422).render("media/playlists/create", {
        medium: req.medium,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/:medium/playlists/create", (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("media/playlists/create", { medium: req.medium });
});

router.get(
  "/:medium/playlists/search",
  async (req: MediumRequest & HasPageRequest, res) => {
    const { rows: playlists, count } = await Playlist.findAndCountAll({
      limit: req.perPage,
      offset: req.offset,
      order: [["title", "ASC"]],
      where: {
        ...(req.query.title && {
          title: { [Op.substring]: req.query.title as string },
        }),
      },
    });

    res.render("media/playlists/_search", {
      medium: req.medium,
      playlists,
      count,
    });
  },
);

router.post(
  "/:medium/playlists/:playlist",
  async (req: MediumRequest & PlaylistRequest, res) => {
    await req.medium.$add("playlist", req.playlist);

    res.set("HX-Trigger", ["close-modal", "refresh-playlists"]).sendStatus(205);
  },
);

router.delete(
  "/:medium/playlists/:playlist",
  async (req: MediumRequest & PlaylistRequest, res) => {
    await req.medium.$remove("playlist", req.playlist);

    res.set("HX-Trigger", "refresh-playlists").sendStatus(205);
  },
);

router.get("/:medium/performers", async (req: MediumRequest, res) => {
  res.render("media/performers/index", {
    medium: req.medium,
    performers: await req.medium.$get("performers"),
  });
});

router.post(
  "/:medium/performers",
  body("name")
    .notEmpty({ ignore_whitespace: true })
    .withMessage("The name is missing."),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const performer = await Performer.create({ name: req.body.name });

      await req.medium.$add("performer", performer);

      res
        .set("HX-Trigger", ["close-modal", "refresh-performers"])
        .sendStatus(201);
    } else
      res.status(422).render("media/performers/create", {
        medium: req.medium,
        errors: errors.mapped(),
      });
  },
);

router.get(
  "/:medium/performers/create",
  async (req: MediumRequest & HasPageRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("media/performers/create", {
      medium: req.medium,
    });
  },
);

router.get(
  "/:medium/performers/search",
  async (req: MediumRequest & HasPageRequest, res) => {
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

    res.render("media/performers/_search", {
      medium: req.medium,
      performers,
      count,
    });
  },
);

router.post(
  "/:medium/performers/:performer",
  async (req: MediumRequest & PerformerRequest, res) => {
    await req.medium.$add("performer", req.performer);

    res
      .set("HX-Trigger", ["close-modal", "refresh-performers"])
      .sendStatus(205);
  },
);

router.delete(
  "/:medium/performers/:performer",
  async (req: MediumRequest & PerformerRequest, res) => {
    await req.medium.$remove("performer", req.performer);

    res.set("HX-Trigger", "refresh-performers").sendStatus(205);
  },
);

router.get("/:medium/categories", async (req: MediumRequest, res) => {
  const labels = await req.medium.$get("labels", { include: [Category] });
  const categories: Record<string, Label[]> = {};

  labels.forEach((label) => {
    if (label.category.name in categories == false)
      categories[label.category.name] = [];
    categories[label.category.name]?.push(label);
  });

  res.render("media/categories/index", {
    medium: req.medium,
    categories,
  });
});

router.get("/:medium/categories/create", (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("categories/create", { medium: req.medium });
});

export default router;
