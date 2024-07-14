import { Request, Response, Router } from "express";
import render from "../pug";

const router = Router();

router.use((req: Request, res: Response, next) => {
  const page = isNaN(req.query.page as any) ? 1 : Number(req.query.page);

  req.currentPage = page;
  res.locals.currentPage = page;
  res.locals.paginator = ({ path, qs, count }) =>
    render("_pagination.pug", { path, qs, count, currentPage: page });

  next();
});

export default router;
