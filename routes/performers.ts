import { Router } from "express";
import Performer from "../database/models/performer";
import { HasPageRequest } from "./middlewares/pagination";

const router = Router();

router.get("/", async (req: HasPageRequest, res) => {
  const { rows: performers, count } = await Performer.findAndCountAll({
    limit: req.perPage,
    offset: (req.currentPage - 1) * req.perPage,
    order: [["name", "ASC"]],
  });

  res.render("performers/index", { count, performers });
});

router.get("/create", (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("performers/create");
});

export default router;
