import { Request, Router } from "express";

declare module "express" {
  interface Request {
    currentPage: number;
  }
}

const router = Router();

router.use((req: Request, res, next) => {
  const page = isNaN(req.query.page as any) ? 1 : Number(req.query.page);

  req.currentPage = page;
  res.locals.currentPage = page;

  next();
});

export default router;
