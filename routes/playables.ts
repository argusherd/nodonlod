import { Router } from "express";
import Playable from "../database/models/playable";

const router = Router();

router.get("/", async (_req, res) => {
  res.render("playables/index", {
    playables: await Playable.findAll(),
  });
});

export default router;
