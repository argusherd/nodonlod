import express from "@/routes";
import {
  HasPageRequest,
  HasPageResponse,
} from "@/routes/middlewares/pagination";
import { HasQsResponse } from "@/routes/middlewares/query-string";
import supertest from "supertest";

describe("The pagination middleware", () => {
  beforeAll(() => {
    express.get(
      "/pagination",
      (req: HasPageRequest, res: HasPageResponse & HasQsResponse) => {
        res.json({
          req: req.currentPage,
          res: res.locals.currentPage,
          paginator: res.locals.paginator({
            path: "/pagination",
            qs: res.locals.qs(),
            count: 100,
          }),
        });
      },
    );
  });

  it("sets the current page number in the request and response payload", async () => {
    await supertest(express)
      .get("/pagination?page=3")
      .expect((res) => {
        expect(res.body.req).toEqual(3);
        expect(res.body.res).toEqual(3);
      });
  });

  it("exposes a paginator function that generates a pagination template", async () => {
    await supertest(express)
      .get("/pagination?q=foo&page=3")
      .expect((res) => {
        expect(res.body.paginator).toContain("/pagination?q=foo&amp;page=10");
      });
  });

  it("renders the first, the last, and the current page links", async () => {
    await supertest(express)
      .get("/pagination?q=foo&page=5")
      .expect((res) => {
        expect(res.body.paginator).toContain("/pagination?q=foo&amp;page=1");
        expect(res.body.paginator).toContain("/pagination?q=foo&amp;page=10");
        expect(res.body.paginator).toContain("/pagination?q=foo&amp;page=5");
      });
  });

  it("only renders two page links on each side of the current page", async () => {
    await supertest(express)
      .get("/pagination?q=foo&page=5")
      .expect((res) => {
        const paginator = res.body.paginator;
        expect(paginator).toContain("/pagination?q=foo&amp;page=3");
        expect(paginator).toContain("/pagination?q=foo&amp;page=4");
        expect(paginator).toContain("/pagination?q=foo&amp;page=6");
        expect(paginator).toContain("/pagination?q=foo&amp;page=7");
        expect(paginator).not.toContain("/pagination?q=foo&amp;page=2");
        expect(paginator).not.toContain("/pagination?q=foo&amp;page=8");
        expect(paginator).not.toContain("/pagination?q=foo&amp;page=9");
      });
  });
});
