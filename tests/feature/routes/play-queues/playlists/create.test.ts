import express from "@/routes";
import supertest from "supertest";

describe("The play queue playlist create page", () => {
  it("displays a form that create a new playlist", async () => {
    await supertest(express)
      .get("/play-queues/playlists/create")
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain("/play-queues/playlists");
      });
  });
});
