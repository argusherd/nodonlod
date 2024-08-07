import { Response, Router } from "express";
import { stringify } from "querystring";

export interface HasQsResponse extends Response {
  locals: {
    qs: () => ParsedQs;
  };
}

export class ParsedQs {
  query: Record<string, any>;

  constructor(query: Record<string, any>) {
    this.query = Object.assign({}, query);
  }

  omit(key: string): ParsedQs {
    const { [key]: _omitted, ...rest } = this.query;

    this.query = rest;

    return this;
  }

  set(key: string, value: any): ParsedQs {
    this.query[key] = value;

    return this;
  }

  toString(): string {
    return stringify(this.query);
  }
}

const router = Router();

router.use((req, res: HasQsResponse, next) => {
  res.locals.qs = () => new ParsedQs(req.query);

  next();
});

export default router;
