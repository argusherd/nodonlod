import { Router } from "express";
import { body, validationResult } from "express-validator";
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

router.post("/", body("name").notEmpty(), async (req, res) => {
  const errors = validationResult(req);

  if (
    !errors.isEmpty() ||
    (await Performer.count({ where: { name: req.body.name } }))
  ) {
    res.status(422).render("performers/create");
    return;
  }

  const performer = await Performer.create({ name: req.body.name });

  res.set("HX-Location", `/performers/${performer.id}`).sendStatus(201);
});

export default router;
