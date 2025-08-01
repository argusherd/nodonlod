import Extraction from "@/database/models/extraction";
import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium update route", () => {
  it("can update the medium data", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}`)
      .type("form")
      .send({
        title: "foo",
        url: "https://foo.bar",
        thumbnail: "thumbnail",
        description: "description",
      })
      .expect(200)
      .expect("HX-Trigger", "data-saved");

    await medium.reload();

    expect(medium.title).toEqual("foo");
    expect(medium.url).toEqual("https://foo.bar");
    expect(medium.thumbnail).toEqual("thumbnail");
    expect(medium.description).toEqual("description");
  });

  it("was necessary to update the medium with the title", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}`)
      .type("form")
      .send({
        url: "https://foo.bar",
        thumbnail: "thumbnail",
        description: "description",
      })
      .expect(422)
      .expect("hx-trigger", "data-failed")
      .expect((res) => {
        expect(res.text).toContain("The title is missing");
      });
  });

  it("was necessary to update the medium with the url", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}`)
      .type("form")
      .send({
        title: "foo",
        thumbnail: "thumbnail",
        description: "description",
      })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The URL is missing");
      });
  });

  it("creates a new extraction to refresh information if the url is updated", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}`)
      .type("form")
      .send({
        title: "foo",
        url: "https://foo.com/bar",
      })
      .expect(200);

    const extraction = await Extraction.findOne();

    expect(await Extraction.count()).toEqual(1);
    expect(extraction?.url).toEqual("https://foo.com/bar");
  });

  it("resets the hasError column if the url is updated", async () => {
    const medium = await createMedium({ hasError: true });

    await supertest(express)
      .put(`/media/${medium.id}`)
      .type("form")
      .send({
        title: "foo",
        url: "https://foo.com/bar",
      })
      .expect(200);

    await medium.reload();

    expect(medium.hasError).toBeFalsy();
  });
});
