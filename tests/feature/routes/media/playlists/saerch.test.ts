import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The medium playlist search route", () => {
  it("displays all available playlists", async () => {
    const medium = await createMedium();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get(`/media/${medium.id}/playlists/search`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(
          `/media/${medium.id}/playlists/${playlist1.id}`,
        );
        expect(res.text).toContain(playlist2.title);
        expect(res.text).toContain(
          `/media/${medium.id}/playlists/${playlist2.id}`,
        );
      });
  });

  it("can filter playlists by title", async () => {
    const medium = await createMedium();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get(`/media/${medium.id}/playlists/search?title=${playlist1.title}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(
          `/media/${medium.id}/playlists/${playlist1.id}`,
        );
        expect(res.text).not.toContain(playlist2.title);
        expect(res.text).not.toContain(
          `/media/${medium.id}/playlists/${playlist2.id}`,
        );
      });
  });
});
