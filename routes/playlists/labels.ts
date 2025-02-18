import { Router } from "express";
import { body, validationResult } from "express-validator";
import { PlaylistRequest } from ".";
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

router.get("/", async (req: PlaylistRequest, res) => {
  const labels = await req.playlist.$get("labels", {
    order: ["category", "text"],
  });

  const template =
    "_list" in req.query ? "labels/_list" : "playlists/labels/index";

  res.render(template, {
    playlist: req.playlist,
    labels,
    basePath: `/playlists/${req.playlist.id}`,
  });
});

router.get("/create", (req: PlaylistRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("labels/create", {
    basePath: `/playlists/${req.playlist.id}`,
  });
});

router.post(
  "/",
  body("text").notEmpty().withMessage(__("The text is missing.")),
  async (req: PlaylistRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const [label] = await Label.findOrCreate({
        where: { category: req.body.category || null, text: req.body.text },
      });

      await req.playlist.$add("label", label);

      res.set("HX-Trigger", ["close-modal", "refresh-labels"]).sendStatus(205);
    } else {
      res.status(422).render("labels/create", {
        basePath: `/playlists/${req.playlist.id}`,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/add", async (req: PlaylistRequest, res) => {
  const labels = await Label.scope({
    method: ["search", req.query.search],
  }).findAll({
    order: [
      ["category", "ASC"],
      ["text", "ASC"],
    ],
  });

  const template =
    "_list" in req.query ? "labels/add/_list" : "labels/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/playlists/${req.playlist.id}`,
    labels,
  });
});

router.post("/:label", async (req: PlaylistRequest & LabelRequest, res) => {
  await req.playlist.$add("label", req.label);

  res.set("HX-Trigger", ["close-modal", "refresh-labels"]).sendStatus(205);
});

router.delete(
  "/:label/confirm",
  async (req: PlaylistRequest & LabelRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("_delete", {
      message: __("Are you sure you want to remove this label?"),
      route: `/playlists/${req.playlist.id}/labels/${req.label.id}`,
    });
  },
);

router.delete("/:label", async (req: PlaylistRequest & LabelRequest, res) => {
  await req.playlist.$remove("label", req.label);

  res.set("HX-Trigger", "refresh-labels").sendStatus(205);
});

export default router;
