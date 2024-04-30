import Extraction from "@/database/models/extraction";
import express from "@/routes";
import supertest from "supertest";

describe("The extraction index page", () => {
  it("contains a form that can generate an extraction", async () => {
    await supertest(express)
      .get("/extractions")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`action="/extractions"`);
        expect(res.text).toContain(`name="isContinuous"`);
        expect(res.text).toContain(`name="page"`);
      });
  });

  it("lists all extractions and provides a link for each extraction", async () => {
    const extraction1 = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    const extraction2 = await Extraction.create({
      url: "https://www.youtube.com/watch?v=wePCOoU7bSs",
    });

    await supertest(express)
      .get("/extractions")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(extraction1.url);
        expect(res.text).toContain(extraction2.url);
        expect(res.text).toContain(`href="/extractions/${extraction1.id}"`);
        expect(res.text).toContain(`href="/extractions/${extraction2.id}"`);
      });
  });
});
