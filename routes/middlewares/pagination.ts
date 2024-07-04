import { Request, Router } from "express";
import { stringify } from "querystring";

declare module "express" {
  interface Request {
    currentPage: number;
  }
}

const router = Router();

router.use((req: Request, res, next) => {
  const page = isNaN(req.query.page as any) ? 1 : Number(req.query.page);
  const path = req.path;

  req.currentPage = page;
  res.locals.currentPage = page;
  res.locals.paginator = (page: number) =>
    `${path}?${stringify({ ...req.query, page })}`;

  next();
});

export default router;
