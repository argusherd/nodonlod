import { Router } from "express";
import { Op } from "sequelize";
import { PlaylistRequest } from ".";
import Medium from "../../database/models/medium";

const router = Router();

router.get("/add", async (req: PlaylistRequest, res) => {
  const { rows: media, count } = await Medium.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [["title", "ASC"]],
    where: {
      ...(req.query.title && {
        title: { [Op.substring]: req.query.title as string },
      }),
    },
  });

  const template = "_list" in req.query ? "media/add/_list" : "media/add";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/playlists/${req.playlist.id}`,
    media,
    count,
  });
});

export default router;
