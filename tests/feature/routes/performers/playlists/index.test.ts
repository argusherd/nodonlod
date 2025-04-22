import express from "@/routes";
import supertest from "supertest";
import {
  createMedium,
  createPerformer,
  createPlaylist,
} from "../../../setup/create-model";

describe("The performer playlist index page", () => {
  it("displays all playlists that belong to the media associated with the given performer", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();
    const notMine = await createPlaylist();

    await performer.$add("medium", medium);
    await medium.$add("playlist", [playlist1, playlist2]);

    await supertest(express)
      .get(`/performers/${performer.id}/playlists`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/playlists/${playlist1.id}`);
        expect(res.text).toContain(`/playlists/${playlist2.id}`);
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(playlist2.title);
        expect(res.text).not.toContain(`/playlists/${notMine.id}`);
        expect(res.text).not.toContain(notMine.title);
      });
  });

  it("does not show duplicated playlists", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const playlist = await createPlaylist();

    await performer.$add("medium", [medium1, medium2]);
    await playlist.$add("medium", [medium1, medium2]);

    const duplicated = new RegExp(`.*>${playlist.title}.*>${playlist.title}.*`);

    await supertest(express)
      .get(`/performers/${performer.id}/playlists`)
      .expect(200)
      .expect((res) => {
        expect(res.text.match(duplicated)).toBeNull();
      });
  });
});
