import express from "@/routes";
import { Request } from "express";
import supertest from "supertest";

describe("The pagination middleware", () => {
  beforeAll(() => {
    express.get("/pagination", (req: Request, res) => {
      res.json({
        req: req.currentPage,
        res: res.locals.currentPage,
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
});
