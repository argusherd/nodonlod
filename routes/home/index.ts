import dayjs from "dayjs";
import { Router } from "express";
import { Op } from "sequelize";
import { Model } from "sequelize-typescript";
import Medium from "../../database/models/medium";
import Performer from "../../database/models/performer";
import Playlist from "../../database/models/playlist";

const router = Router();

router.get("/", async (_req, res) => {
  const items: Model[] = [
    ...(await Medium.findAll({
      where: { createdAt: { [Op.gte]: dayjs().subtract(7, "d").toDate() } },
    })),
    ...(await Playlist.findAll({
      where: { createdAt: { [Op.gte]: dayjs().subtract(7, "d").toDate() } },
    })),
    ...(await Performer.findAll({
      where: { createdAt: { [Op.gte]: dayjs().subtract(7, "d").toDate() } },
    })),
  ];

  items.sort((a, b) => b.createdAt - a.createdAt);

  res.render("home", { items });
});

export default router;
