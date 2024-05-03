import Extraction from "@/database/models/extraction";
import express from "@/routes";
import supertest from "supertest";

describe("The extraction store route", () => {
  const videoURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  it("creates an extraction by providing a URL", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL })
      .expect(201);

    expect(await Extraction.count()).toEqual(1);

    const extraction = await Extraction.findOne();

    expect(extraction?.url).toEqual(videoURL);
  });

  it("tells htmx to redirect to the index page after successfully creating an extraction", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL })
      .expect("HX-Location", "/extractions");
  });

  it("must not provide a empty URL", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: "" })
      .expect(422);

    expect(await Extraction.count()).toEqual(0);
  });

  it("can create a continuous extraction", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL, isContinuous: true })
      .expect(201);

    const extraction = await Extraction.findOne();

    expect(extraction?.isContinuous).toBeTruthy();
  });

  it("can specify the page number for extraction", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL, page: 5 })
      .expect(201);

    const extraction = await Extraction.findOne();

    expect(extraction?.page).toEqual(5);
  });

  it("should only provide the numeric page number or leave the page number empty", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL, page: "not numeric" })
      .expect(422);

    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL, page: "" })
      .expect(201);

    const extraction = await Extraction.findOne();

    expect(extraction?.page).toEqual(1);
  });

  it("can create an extraction that does not convert the raw info content into playables/playlists", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL, isConvertible: 1 })
      .expect(201);

    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: videoURL, isConvertible: undefined })
      .expect(201);

    const isConvertible = await Extraction.findOne();
    const isNotConvertible = await Extraction.findOne({ offset: 1 });

    expect(isConvertible?.isConvertible).toBeTruthy();
    expect(isNotConvertible?.isConvertible).toBeFalsy();
  });
});
