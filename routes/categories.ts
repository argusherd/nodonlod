import { Router } from "express";
import Category from "../database/models/category";

const router = Router();

router.get("/create/_select", (_req, res) => {
  res.render("categories/_select");
});

router.get("/create/_options", async (_req, res) => {
  res.render("categories/_options", { categories: await Category.findAll() });
});

router.get("/create/_inputs", (_req, res) => {
  res.render("categories/_inputs");
});

export default router;
