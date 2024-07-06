import Extraction from "@/database/models/extraction";
import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";

describe("The destroy extraction route", () => {
  it("deletes the extraction", async () => {
    const extraction = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await supertest(express)
      .delete(`/extractions/${extraction.id}`)
      .expect(204)
      .expect("HX-Redirect", "/extractions");

    expect(await Extraction.count()).toEqual(0);
  });

  it("can delete all extractions", async () => {
    await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await supertest(express).delete("/extractions").expect(204);

    expect(await Extraction.count()).toEqual(0);
  });

  it("responds with the current page of the extractions when asked for", async () => {
    for (let i = 0; i < 10; i++)
      await Extraction.create({
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      });

    const showInPage2 = dayjs().subtract(1, "hour").toDate();

    const extraction = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      createdAt: showInPage2,
    });

    await Extraction.create({
      url: "https://www.youtube.com/watch?v=wePCOoU7bSs",
      createdAt: showInPage2,
    });

    await supertest(express)
      .delete(`/extractions/${extraction.id}?page=2&_list`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("wePCOoU7bSs");
        expect(res.text).not.toContain("dQw4w9WgXcQ");
      });
  });
});
