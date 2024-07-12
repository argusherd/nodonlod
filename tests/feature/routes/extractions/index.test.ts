import Extraction from "@/database/models/extraction";
import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";

describe("The extraction index page", () => {
  it("contains a form that can generate an extraction", async () => {
    await supertest(express)
      .get("/extractions")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`action="/extractions"`);
        expect(res.text).toContain(`name="isContinuous"`);
        expect(res.text).toContain(`name="isConvertible"`);
        expect(res.text).toContain(`name="page"`);
      });
  });

  it("lists extractions and provides a link for each extraction", async () => {
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

  it("lists 10 extractions based on the createdAt column in descending order per page", async () => {
    await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });

    for (let i = 0; i < 10; i++)
      await Extraction.create({
        url: "https://www.youtube.com/watch?v=wePCOoU7bSs",
      });

    await supertest(express)
      .get("/extractions")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("wePCOoU7bSs");
        expect(res.text).not.toContain("dQw4w9WgXcQ");
      });

    await supertest(express)
      .get("/extractions?page=2")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("dQw4w9WgXcQ");
        expect(res.text).not.toContain("wePCOoU7bSs");
      });
  });

  it("displays a tag to indicate that the extraction has an error", async () => {
    await Extraction.create({
      url: "https://www.youtube.com/watch?v=wePCOoU7bSs",
      error: "Unsupported",
    });

    await supertest(express)
      .get("/extractions")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("Error");
      });
  });

  it("displays a tag to indicate that the extraction is currently processing", async () => {
    await Extraction.create({
      url: "https://www.youtube.com/watch?v=wePCOoU7bSs",
      isProcessing: true,
    });

    await supertest(express)
      .get("/extractions")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("Processing");
      });
  });
});
