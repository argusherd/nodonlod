import Extraction from "@/database/models/extraction";
import express from "@/routes";
import supertest from "supertest";

describe("The extraction store route", () => {
  it("can persist an extraction record by providing a URL", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
      .expect(201);

    const extraction = await Extraction.findOne();

    expect(extraction).not.toBeNull();
    expect(extraction?.url).toEqual(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("instructs the client to redirect to the /extractions page after successfully creating an extraction", async () => {
    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
      .expect((res) => {
        expect(res.header["hx-location"]).toBe("/extractions");
      });
  });

  it("must not provide a empty string", async () => {
    await supertest(express).post("/extractions").expect(422);

    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: "" })
      .expect(422);

    await supertest(express)
      .post("/extractions")
      .type("form")
      .send({ url: null })
      .expect(422);
  });
});
