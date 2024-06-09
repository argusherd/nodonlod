import { Router } from "express";
import { I18n } from "i18n";
import { join } from "path";

const relativePath = process.env.NODE_ENV === "test" ? "../../" : "../../../";

export const i18n = new I18n({
  cookie: "locale",
  directory: join(__dirname, relativePath, "locales"),
  updateFiles: false,
});

const router = Router();

router.use((req, res, next) => {
  if (!req.query.locale) next();
  else {
    res.cookie("locale", req.query.locale);
    res.redirect("back");
  }
});

router.use(i18n.init);

export default router;
