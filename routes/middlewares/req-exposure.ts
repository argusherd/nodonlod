import { Response, Router } from "express";

export interface HasExposedReqResponse extends Response {
  locals: {
    old: Record<string, any>;
    fullPath: String;
  };
}

const router = Router();

router.use((req, res: HasExposedReqResponse, next) => {
  res.locals.old = req.body;
  res.locals.fullPath = req.baseUrl + req.path;

  next();
});

export default router;
