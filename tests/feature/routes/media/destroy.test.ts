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

  it("can display a confirmation message for deletion", async () => {
    const medium = await createMedium();

    await supertest(express)
      .delete(`/media/${medium.id}/confirm`)
      .expect(200)
      .expect("HX-Trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to delete this medium?",
        );
        expect(res.text).toContain(`/media/${medium.id}`);
      });
  });
});
