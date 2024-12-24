import express from "@/routes";
import { HasExposedReqResponse } from "@/routes/middlewares/req-exposure";
import supertest from "supertest";

describe("The req-exposure middleware", () => {
  beforeAll(() => {
    express.post("/api/req/expose", (_req, res: HasExposedReqResponse) => {
      res.json({
        old: res.locals.old,
        fullPath: res.locals.fullPath,
      });
    });
  });

  it("exposes the current inputs from the request to the response locals", async () => {
    await supertest(express)
      .post("/api/req/expose")
      .type("form")
      .send({
        text: "foo",
        num: 69,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.old.text).toEqual("foo");
        expect(res.body.old.num).toEqual("69");
      });
  });

  it("exposes the current full path from the request to the response locals", async () => {
    await supertest(express)
      .post("/api/req/expose")
      .expect(200)
      .expect((res) => {
        expect(res.body.fullPath).toEqual("/api/req/expose");
      });
  });
});
