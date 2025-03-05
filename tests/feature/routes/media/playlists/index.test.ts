import Playlistable from "@/database/models/playlistable";
import express from "@/routes";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
} from "../../../setup/create-model";

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

  it("successfully displays the playlists in list mode", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await medium.$add("playlist", playlist);

    await supertest(express).get(`/media/${medium.id}/playlists`).expect(200);
  });

  it("avoids displaying duplicated playlists", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({ mediumId: medium.id });
    const playlist = await createPlaylist();

    await Playlistable.bulkCreate([
      { mediumId: medium.id, playlistId: playlist.id },
      { mediumId: medium.id, chapterId: chapter.id, playlistId: playlist.id },
    ]);

    await supertest(express)
      .get(`/media/${medium.id}/playlists`)
      .expect(200)
      .expect((res) => {
        const regex = new RegExp(
          `alt="${playlist.title}".*${playlist.title}.*${playlist.title}`,
        );

        expect(regex.test(res.text)).toBeFalsy();
      });
  });
});
