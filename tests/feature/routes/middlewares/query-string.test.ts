import express from "@/routes";
import { ParsedQs } from "@/routes/middlewares/query-string";
import { Response } from "express";
import supertest from "supertest";

describe("The query string middleware", () => {
  beforeAll(() => {
    express.get("/query-string", (_req, res: Response) => {
      res.json({
        qs: res.locals.qs().set("foo", "bar").omit("baz").toString(),
      });
    });
  });

  it("exposes a ParsedQs object for dedicated query string manipulation", async () => {
    await supertest(express)
      .get("/query-string?foo=foo&baz=123&page=1")
      .expect((res) => {
        expect(res.body.qs).toEqual("foo=bar&page=1");
      });
  });

  it("will not modify the original query string object", () => {
    const query = { foo: "bar" };
    const qs = new ParsedQs(query);

    qs.set("foo", "baz");

    expect(query.foo).toEqual("bar");
  });
});
