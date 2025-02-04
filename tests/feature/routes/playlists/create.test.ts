import express from "@/routes";
import supertest from "supertest";

describe("The playlist create page", () => {
  it("displays a form that create a new playlist", async () => {
    await supertest(express)
      .get("/playlists/create")
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain("/playlists");
      });
  });
});
