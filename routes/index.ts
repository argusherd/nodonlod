import coreExpress from "express";

const express = coreExpress();

express.set("view engine", "pug");
express.use(coreExpress.static("public"));

express.get("/", async (_req, res) => {
  res.render("home");
});

export default express;
