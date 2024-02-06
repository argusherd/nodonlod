import coreExpress from "express";
import { engine as hbsEngine } from "express-handlebars";

const express = coreExpress();

express.engine(".hbs", hbsEngine({ extname: ".hbs" }));
express.set("view engine", ".hbs");
express.use(coreExpress.static("public"));

express.get("/", async (_req, res) => {
  res.render("home");
});

export default express;
