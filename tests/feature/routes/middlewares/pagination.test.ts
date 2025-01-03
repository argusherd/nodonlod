import express from "@/routes";
import supertest from "supertest";

describe("The pagination middleware", () => {
  beforeAll(() => {
    express.get("/pagination", (_req, res) => {
      res.render("test/pagination", { count: 100 });
    });
  });

  it("renders the first, the last, and the current page links", async () => {
    await supertest(express)
      .get("/pagination?q=foo&page=5")
      .expect((res) => {
        expect(res.text).toContain("/pagination?q=foo&amp;page=1");
        expect(res.text).toContain("/pagination?q=foo&amp;page=10");
        expect(res.text).toContain("/pagination?q=foo&amp;page=5");
      });
  });

  it("only renders two page links on each side of the current page", async () => {
    await supertest(express)
      .get("/pagination?q=foo&page=5")
      .expect((res) => {
        expect(res.text).toContain("/pagination?q=foo&amp;page=3");
        expect(res.text).toContain("/pagination?q=foo&amp;page=4");
        expect(res.text).toContain("/pagination?q=foo&amp;page=6");
        expect(res.text).toContain("/pagination?q=foo&amp;page=7");
        expect(res.text).not.toContain("/pagination?q=foo&amp;page=2");
        expect(res.text).not.toContain("/pagination?q=foo&amp;page=8");
        expect(res.text).not.toContain("/pagination?q=foo&amp;page=9");
      });
  });

  it("defaults to displaying 10 items on the page", async () => {
    await supertest(express)
      .get("/pagination")
      .expect((res) => {
        expect(res.text).toContain("1-10 (100)");
      });
  });

  it("can set a specific limit on the number of results displayed on the page", async () => {
    await supertest(express)
      .get("/pagination?limit=20")
      .expect((res) => {
        expect(res.text).toContain("/pagination?limit=20&amp;page=1");
        expect(res.text).toContain("/pagination?limit=20&amp;page=5");
        expect(res.text).toContain("1-20 (100)");
        expect(res.text).not.toContain("/pagination?limit=20&amp;page=6");
      });
  });
});
