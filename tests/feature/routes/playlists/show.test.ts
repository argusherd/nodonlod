import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import supertest from "supertest";
import {
  createChapter,
  createPlayable,
  createPlaylist,
} from "../../setup/create-model";

describe("The playlist show page", () => {
  it("can only be accessed with an existing playlist", async () => {
    await supertest(express).get("/playlists/NOT_EXIST").expect(404);
  });

  it("displays the information of the playlist", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist.title);
      });
  });

  it("lists all related playables and chapters", async () => {
    const playlist = await createPlaylist();
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();
    const chapter = await createChapter();
    const fromChapter = await chapter.$get("playable");

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, playableId: playable1.id },
      { playlistId: playlist.id, playableId: playable2.id },
      {
        playlistId: playlist.id,
        playableId: chapter.playableId,
        chapterId: chapter.id,
      },
    ]);

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playable1.title);
        expect(res.text).toContain(`/playables/${playable1.id}`);
        expect(res.text).toContain(playable2.title);
        expect(res.text).toContain(`/playables/${playable2.id}`);
        expect(res.text).toContain(chapter.title);
        expect(res.text).toContain(fromChapter?.title);
        expect(res.text).toContain(`/playables/${fromChapter?.id}`);
      });
  });

  it("lists all related playables and chapters based on their ordering value", async () => {
    const playlist = await createPlaylist();
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();
    const chapter = await createChapter();

    await playlist.$add("playable", playable1, { through: { order: 50 } });
    await playlist.$add("playable", playable2, { through: { order: 49 } });
    await PlaylistItem.create({
      playlistId: playlist.id,
      playableId: chapter.playableId,
      chapterId: chapter.id,
      order: 48,
    });

    const displayOrder = new RegExp(
      `.*${chapter.title}.*${playable2.title}.*${playable1.title}.*`,
    );

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text.match(displayOrder)).not.toBeNull();
      });
  });
});
