import { Response, Router } from "express";

export interface HasOldInputsResponse extends Response {
  locals: {
    old: Record<string, any>;
  };
}

const router = Router();

router.use((req, res: HasOldInputsResponse, next) => {
  res.locals.old = req.body;

  next();
});

export default router;
