import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import Extraction from "../database/models/extraction";
import RawInfoConverter, { Overwritable } from "../src/raw-info-converter";
import {
  RawPlayable,
  RawPlaylist,
  SubRawPlayable,
} from "../src/raw-info-extractor";

interface ExtractionRequest extends Request {
  extraction: Extraction;
}

const router = Router();

router.param("extraction", async (req: ExtractionRequest, res, next) => {
  const extraction = await Extraction.findByPk(req.params.extraction);

  if (extraction) {
    req.extraction = extraction;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (_req, res) => {
  res.render("extractions/index", {
    extractions: await Extraction.findAll(),
  });
});

router.post(
  "/",
  body("url").notEmpty(),
  body("page").isNumeric().optional({ values: "falsy" }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    await Extraction.create({
      url: req.body.url,
      isContinuous: Boolean(req.body.isContinuous),
      isConvertible: Boolean(req.body.isConvertible),
      page: req.body.page || undefined,
    });

    res.set("HX-Location", "/extractions").sendStatus(201);
  },
);

router.delete("/", async (_req, res) => {
  await Extraction.truncate();

  res.sendStatus(204);
});

router.get("/:extraction", async (req: ExtractionRequest, res) => {
  const extraction = req.extraction;

  res.render("extractions/show", { extraction });
});

router.post(
  "/:extraction/convert",
  body("resourceId").notEmpty(),
  async (req: ExtractionRequest, res) => {
    if (!validationResult(req).isEmpty()) {
      res.sendStatus(422);
      return;
    }

    const rawInfo = findRawInfoById(
      req.extraction.content,
      req.body.resourceId,
    );

    if (!rawInfo) {
      res.sendStatus(404);
      return;
    }

    const converter = new RawInfoConverter();
    const { title, description, thumbnail, ageLimit }: Overwritable = req.body;

    if ("_type" in rawInfo === false || rawInfo._type === "video") {
      await converter.toPlayble(rawInfo, {
        title,
        description,
        thumbnail,
        ageLimit,
      });
    } else {
      await converter.toPlaylist(rawInfo, { title, description, thumbnail });
    }

    res.sendStatus(201);
  },
);

router.delete("/:extraction", async (req: ExtractionRequest, res) => {
  await req.extraction.destroy();

  res.sendStatus(204);
});

function findRawInfoById(
  rawInfo: RawPlayable | RawPlaylist | SubRawPlayable | null,
  id: string,
): RawPlayable | RawPlaylist | SubRawPlayable | null {
  if (!rawInfo || rawInfo.id === id) return rawInfo;

  for (const childRawInfo of "entries" in rawInfo ? rawInfo.entries : []) {
    const targetRawInfo = findRawInfoById(childRawInfo, id);

    if (targetRawInfo) return targetRawInfo;
  }

  return null;
}

export default router;
