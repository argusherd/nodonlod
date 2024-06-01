import Extraction from "@/database/models/extraction";
import express from "@/routes";
import supertest from "supertest";

describe("The destroy extraction route", () => {
  it("deletes the extraction", async () => {
    const extraction = await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await supertest(express)
      .delete(`/extractions/${extraction.id}`)
      .expect(204);

    expect(await Extraction.count()).toEqual(0);
  });

  it("can delete all extractions", async () => {
    await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await supertest(express).delete("/extractions").expect(204);

    expect(await Extraction.count()).toEqual(0);
  });
});
