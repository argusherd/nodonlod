import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The medium playlist index page", () => {
  it("displays all the playlists to which the medium belongs", async () => {
    const medium = await createMedium();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await medium.$add("playlist", [playlist1, playlist2]);

    await supertest(express)
      .get(`/media/${medium.id}/playlists`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(`/playlists/${playlist1.id}`);
        expect(res.text).toContain(playlist2.title);
        expect(res.text).toContain(`/playlists/${playlist2.id}`);
      });
  });
});
