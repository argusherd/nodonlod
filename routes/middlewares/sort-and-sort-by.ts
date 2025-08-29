import { NextFunction, Request, Response } from "express";

function sortAndSortBy(supportedSort: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const querySort = req.query.sort as string;
    const querySortBy = ((req.query.sortBy as string) || "").toLowerCase();

    req.query.sort = supportedSort.includes(querySort)
      ? querySort
      : "createdAt";

    req.query.sortBy = ["asc", "desc"].includes(querySortBy)
      ? querySortBy
      : "desc";

    next();
  };
}

export default sortAndSortBy;
