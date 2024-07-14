import { ParsedQs } from "./middlewares/query-string";

interface PaginatorParams {
  path: string;
  qs: ParsedQs;
  count?: number;
}

declare module "express" {
  interface Request {
    currentPage: number;
  }

  interface Response {
    locals: {
      currentPage: number;
      paginator: (params: PaginatorParams) => string;
      qs: () => ParsedQs;
    };
  }
}
