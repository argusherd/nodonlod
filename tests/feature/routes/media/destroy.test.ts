import Medium from "@/database/models/medium";
import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The destory medium route", () => {
  it("deletes the medium", async () => {
    const medium = await createMedium();

    await supertest(express).delete(`/media/${medium.id}`).expect(204);

    expect(await Medium.count()).toEqual(0);
  });

  it("directs htmx to navigate to the media index page", async () => {
    const medium = await createMedium();

    await supertest(express)
      .delete(`/media/${medium.id}`)
      .expect(204)
      .expect("HX-Location", "/media");
  });
});
