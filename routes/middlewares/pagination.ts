import { Request, Response, Router } from "express";
import render from "../pug";
import { ParsedQs } from "./query-string";

export interface HasPageRequest extends Request {
  currentPage: number;
}

export interface HasPageResponse extends Response {
  locals: {
    currentPage: number;
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

  req.currentPage = page;
  res.locals.currentPage = page;
  res.locals.paginator = ({ path, qs, count }) =>
    render("_pagination.pug", { path, qs, count, currentPage: page });

  next();
});

export default router;
