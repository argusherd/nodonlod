import { Router } from "express";
import { body, validationResult } from "express-validator";
import Extraction from "../database/models/extraction";
import RawInfoConverter, { Overwritable } from "../src/raw-info-converter";
import {
  RawMedium,
  RawPlaylist,
  SubRawMedium,
} from "../src/raw-info-extractor";
import { HasPageRequest } from "./middlewares/pagination";

interface ExtractionRequest extends HasPageRequest {
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

router.get("/", async (req: HasPageRequest, res) => {
  const { rows: extractions, count } = await paginated(req.currentPage);

  const template =
    req.query._list != undefined ? "extractions/_list" : "extractions/index";

  res.render(template, {
    extractions,
    count,
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

    const { rows: extractions, count } = await paginated(1);

    res.status(201).render("extractions/_list", {
      extractions,
      count,
    });
  },
);

router.delete("/", async (_req, res) => {
  await Extraction.truncate();

  res.set("HX-Location", "/extractions").sendStatus(204);
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
    let url = "";

    if ("_type" in rawInfo === false || rawInfo._type === "video") {
      const medium = await converter.toMedium(rawInfo, {
        title,
        description,
        thumbnail,
        ageLimit,
      });

      url = `/media/${medium?.id}`;
    } else {
      const playlist = await converter.toPlaylist(rawInfo, {
        title,
        description,
        thumbnail,
      });

      url = `/playlists/${playlist?.id}`;
    }

    res.render("extractions/_converted", { url });
  },
);

router.delete("/:extraction", async (req: ExtractionRequest, res) => {
  await req.extraction.destroy();

  if (req.query._list === undefined) {
    res.set("HX-Location", "/extractions").sendStatus(204);
  } else {
    const { rows: extractions, count } = await paginated(req.currentPage);

    res.render("extractions/_list", {
      extractions,
      count,
    });
  }
});

function findRawInfoById(
  rawInfo: RawMedium | RawPlaylist | SubRawMedium | null,
  id: string,
): RawMedium | RawPlaylist | SubRawMedium | null {
  if (!rawInfo || rawInfo.id === id) return rawInfo;

  for (const childRawInfo of "entries" in rawInfo ? rawInfo.entries : []) {
    const targetRawInfo = findRawInfoById(childRawInfo, id);

    if (targetRawInfo) return targetRawInfo;
  }

  return null;
}

async function paginated(page: number) {
  const limit = 10;

  return await Extraction.findAndCountAll({
    offset: Math.max(page - 1, 0) * limit,
    limit,
    order: [["createdAt", "DESC"]],
  });
}

export default router;
