import express from "@/routes";
import supertest from "supertest";
import { createPlaylist } from "../../setup/create-playable";

describe("The playlist index page", () => {
  it("can view all the playlists", async () => {
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get("/playlists")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/playlists/${playlist1.id}`);
        expect(res.text).toContain(`/playlists/${playlist2.id}`);
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(playlist2.title);
      });
  });
});
