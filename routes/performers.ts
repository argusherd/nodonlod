import { Router } from "express";
import { body, validationResult } from "express-validator";
import Performer from "../database/models/performer";
import { HasPageRequest } from "./middlewares/pagination";

interface PerformerRequest extends HasPageRequest {
  performer: Performer;
}

const router = Router();

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

router.get("/:performer", async (req: PerformerRequest, res) => {
  res.render("performers/show", { performer: req.performer });
});

export default router;
