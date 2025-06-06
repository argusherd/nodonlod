import { Router } from "express";
import { body, validationResult } from "express-validator";
import Extraction from "../database/models/extraction";
import RawInfoConverter, { Overwritable } from "../src/raw-info-converter";
import {
  RawMedium,
  RawPlaylist,
  SubRawMedium,
} from "../src/raw-info-extractor";
import { __ } from "./middlewares/i18n";
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
  const { rows: extractions, count } = await Extraction.findAndCountAll({
    offset: req.offset,
    limit: req.perPage,
    order: [["createdAt", "DESC"]],
  });

  res.render("extractions/_list", {
    extractions,
    count,
  });
});

router.post(
  "/",
  body("url").notEmpty().withMessage("The URL is missing."),
  body("page")
    .isNumeric({ no_symbols: true })
    .withMessage("The page should be positive interger")
    .optional({ values: "falsy" }),
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await Extraction.create({
        url: req.body.url,
        isContinuous: Boolean(req.body.isContinuous),
        isConvertible: Boolean(req.body.isConvertible),
        shouldPreserveChapters: Boolean(req.body.shouldPreserveChapters),
        shouldPreserveTags: Boolean(req.body.shouldPreserveTags),
        page: req.body.page || undefined,
      });

      const location = JSON.stringify({
        path: "/extractions",
        target: "#extractions",
      });

      res.set("HX-Location", location).sendStatus(201);
    } else {
      res.status(422).render("extractions/_form", { errors: errors.mapped() });
    }
  },
);

router.get("/create", (_req, res) => {
  res.render("extractions/create");
});

router.delete("/confirm", (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete all extractions?"),
    route: "/extractions",
  });
});

router.delete("/", async (_req, res) => {
  await Extraction.truncate();

  const location = JSON.stringify({
    path: "/extractions",
    target: "#extractions",
  });

  res.set("HX-Location", location).sendStatus(204);
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

    converter.shouldPreserveChapters = Boolean(req.body.includeChapters);
    converter.shouldPreserveTags = Boolean(req.body.includeTags);

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

  if (req.query._list === undefined) res.set("HX-Location", "/extractions");
  else res.set("HX-Trigger", "refresh-extractions");

  res.sendStatus(204);
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

export default router;
