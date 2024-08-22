import { Request, Response, Router } from "express";
import render from "../pug";
import { ParsedQs } from "./query-string";

export interface HasPageRequest extends Request {
  currentPage: number;
  perPage: number;
}

export interface HasPageResponse extends Response {
  locals: {
    currentPage: number;
    perPage: number;
    paginator: (params: {
      path: string;
      qs: ParsedQs;
      count?: number;
    }) => string;
  };
}

const router = Router();

router.use((req: HasPageRequest, res: HasPageResponse, next) => {
  const page = isNaN(req.query.page as any) ? 1 : Number(req.query.page);
  const limit = isNaN(req.query.limit as any) ? 10 : Number(req.query.limit);

  req.currentPage = page;
  req.perPage = limit;
  res.locals.currentPage = page;
  res.locals.perPage = limit;
  res.locals.paginator = ({ path, qs, count }) =>
    render("_pagination.pug", {
      path,
      qs,
      count,
      currentPage: page,
      perPage: limit,
    });

  next();
});

export default router;
