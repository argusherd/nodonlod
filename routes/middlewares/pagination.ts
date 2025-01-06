import { Request, Response, Router } from "express";

export interface HasPageRequest extends Request {
  currentPage: number;
  perPage: number;
  offset: number;
}

export interface HasPageResponse extends Response {
  locals: {
    currentPage: number;
    perPage: number;
  };
}

const router = Router();

router.use((req: HasPageRequest, res: HasPageResponse, next) => {
  const page = isNaN(req.query.page as any) ? 1 : Number(req.query.page);
  const limit = isNaN(req.query.limit as any) ? 10 : Number(req.query.limit);

  req.currentPage = page;
  req.perPage = limit;
  req.offset = Math.max(page - 1, 0) * limit;
  res.locals.currentPage = page;
  res.locals.perPage = limit;

  next();
});

export default router;
