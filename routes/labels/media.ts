import { Router } from "express";
import { Op } from "sequelize";
import { LabelRequest } from ".";
import Medium from "../../database/models/medium";

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
