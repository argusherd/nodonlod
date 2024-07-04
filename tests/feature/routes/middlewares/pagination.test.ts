import express from "@/routes";
import { Request } from "express";
import supertest from "supertest";

describe("The pagination middleware", () => {
  beforeAll(() => {
    express.get("/pagination", (req: Request, res) => {
      res.json({
        req: req.currentPage,
        res: res.locals.currentPage,
        paginator: res.locals.paginator(10),
      });
    });

    express.get("/pagination.pug", (_req, res) => {
      res.render("_pagination.pug", {
        count: 100,
      });
    });
  });

  it("sets the current page number in the request and response payload", async () => {
    await supertest(express)
      .get("/pagination?page=3")
      .expect((res) => {
        expect(res.body.req).toEqual(3);
        expect(res.body.res).toEqual(3);
      });
  });

  it("exposes a new page URL with a query string function to the locals", async () => {
    await supertest(express)
      .get("/pagination?q=foo&page=3")
      .expect((res) => {
        expect(res.body.paginator).toEqual("/pagination?q=foo&page=10");
      });
  });

  it("renders the first, the last, and the current page links", async () => {
    await supertest(express)
      .get("/pagination.pug?q=foo&page=5")
      .expect((res) => {
        expect(res.text).toContain("/pagination.pug?q=foo&amp;page=1");
        expect(res.text).toContain("/pagination.pug?q=foo&amp;page=10");
        expect(res.text).toContain("/pagination.pug?q=foo&amp;page=5");
      });
  });

  it("only renders two page links on each side of the current page", async () => {
    await supertest(express)
      .get("/pagination.pug?q=foo&page=5")
      .expect((res) => {
        expect(res.text).not.toContain("/pagination.pug?q=foo&amp;page=2");
        expect(res.text).not.toContain("/pagination.pug?q=foo&amp;page=8");
        expect(res.text).not.toContain("/pagination.pug?q=foo&amp;page=9");
      });
  });
});
