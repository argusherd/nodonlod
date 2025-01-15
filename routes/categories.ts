import { Router } from "express";
import Category from "../database/models/category";

const router = Router();

router.get("/", async (_req, res) => {
  res.render("categories/_list", { categories: await Category.findAll() });
});

export default router;
