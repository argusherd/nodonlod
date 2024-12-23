import express from "@/routes";
import { HasOldInputsResponse } from "@/routes/middlewares/old-inputs";
import supertest from "supertest";

describe("The old-inputs middleware", () => {
  beforeAll(() => {
    express.post("/old-inputs", (_req, res: HasOldInputsResponse) => {
      res.json({ old: res.locals.old });
    });
  });

  it("exposes the current inputs from the request to the response locals", async () => {
    await supertest(express)
      .post("/old-inputs")
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
});
