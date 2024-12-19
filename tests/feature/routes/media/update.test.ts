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
      .expect(205)
      .expect("HX-Trigger", "medium-saved");

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
      .expect(422);
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
      .expect(422);
  });
});
