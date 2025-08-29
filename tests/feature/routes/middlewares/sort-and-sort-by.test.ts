import express from "@/routes";
import sortAndSortBy from "@/routes/middlewares/sort-and-sort-by";
import supertest from "supertest";

describe("The sort and sort by middleware", () => {
  const supportedSort = ["createdAt", "description", "title"];

  beforeAll(() => {
    express
      .use(sortAndSortBy(supportedSort))
      .get("/sort-and-sort-by", (req, res) => {
        res.json({
          sort: req.query.sort,
          sortBy: req.query.sortBy,
        });
      });
  });

  it("overwrites unsupported sort and sort-by queries in the request's query string", async () => {
    await supertest(express)
      .get("/sort-and-sort-by?sort=name&sortBy=acc")
      .expect((res) => {
        expect(res.body.sort).toEqual("createdAt");
        expect(res.body.sortBy).toEqual("desc");
      });

    await supertest(express)
      .get("/sort-and-sort-by?sort=title&sortBy=asc")
      .expect((res) => {
        expect(res.body.sort).toEqual("title");
        expect(res.body.sortBy).toEqual("asc");
      });
  });

  it("overwrites the unspecified sort and sort-by queries", async () => {
    await supertest(express)
      .get("/sort-and-sort-by")
      .expect(200)
      .expect((res) => {
        expect(res.body.sort).toEqual("createdAt");
        expect(res.body.sortBy).toEqual("desc");
      });
  });
});
