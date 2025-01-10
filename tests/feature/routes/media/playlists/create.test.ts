import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../../setup/create-model";

describe("The medium playlist create page", () => {
  it("successfully displays the page to search and create playlists", async () => {
    const medium = await createMedium();

    await supertest(express)
      .get(`/media/${medium.id}/playlists/create`)
      .expect(200)
      .expect("HX-Trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(`/media/${medium.id}/playlists/search`);
      });
  });
});
