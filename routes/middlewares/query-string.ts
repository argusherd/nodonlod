import { Response, Router } from "express";
import { stringify } from "querystring";

export interface HasQsResponse extends Response {
  locals: {
    qs: () => ParsedQs;
  };
}

export class ParsedQs {
  [key: string]: any;

  constructor(obj: Record<string, any>) {
    Object.assign(this, obj);
  }

  omit(key: string): ParsedQs {
    delete this[key];

    return this;
  }

  set(key: string, value: any): ParsedQs {
    this[key] = value;

    return this;
  }

  toString(): string {
    return stringify(
      Object.fromEntries(
        Object.entries(this).filter(
          ([_, value]) => typeof value !== "function",
        ),
      ),
    );
  }
}

const router = Router();

router.use((req, res: HasQsResponse, next) => {
  res.locals.qs = () => new ParsedQs(req.query);

  next();
});

export default router;
