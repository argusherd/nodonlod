import { Router } from "express";
import { PerformerRequest } from ".";

const router = Router();

router.get("/", async (req: PerformerRequest, res) => {
  res.render("performers/media/index", {
    performer: req.performer,
    media: await req.performer.$get("media"),
  });
});

export default router;
