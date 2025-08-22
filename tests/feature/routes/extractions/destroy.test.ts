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
      .expect(204)
      .expect("HX-Location", "/extractions/create");

    expect(await Extraction.count()).toEqual(0);
  });

  it("can delete all extractions", async () => {
    await Extraction.create({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await supertest(express)
      .delete("/extractions")
      .expect(204)
      .expect(
        "HX-Location",
        JSON.stringify({ path: "/extractions", target: "#extractions" }),
      );

    expect(await Extraction.count()).toEqual(0);
  });

  it("tells htmx to refresh the list if the deletion is from the index page", async () => {
    const extraction = await Extraction.create({
      url: "https://www.youtube.com/watch?v=wePCOoU7bSs",
    });

    await supertest(express)
      .delete(`/extractions/${extraction.id}?_list`)
      .expect(204)
      .expect("HX-Trigger", "refresh-extractions");
  });

  it("can display a confirmation message for deletion", async () => {
    await supertest(express)
      .delete("/extractions/confirm")
      .expect(200)
      .expect("HX-Trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to delete all extractions?",
        );
        expect(res.text).toContain("/extractions");
      });
  });
});
