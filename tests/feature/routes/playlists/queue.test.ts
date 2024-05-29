import PlayQueue from "@/database/models/play-queue";
import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import supertest from "supertest";
import {
  createChapter,
  createPlayable,
  createPlaylist,
} from "../../setup/create-model";

describe("The queue playlist route", () => {
  it("adds all the playlist items to the play queue", async () => {
    const playlist = await createPlaylist();
    const playable = await createPlayable();
    const chapter = await createChapter();

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, playableId: playable.id },
      {
        playlistId: playlist.id,
        playableId: chapter.playableId,
        chapterId: chapter.id,
      },
    ]);

    await supertest(express)
      .post(`/playlists/${playlist.id}/queue`)
      .expect(201);

    expect(await PlayQueue.count()).toEqual(2);

    const hasPlayable = await PlayQueue.count({
      where: { playableId: playable.id },
    });
    const hasChapter = await PlayQueue.count({
      where: { playableId: chapter.playableId, chapterId: chapter.id },
    });

    expect(hasPlayable).toBeTruthy();
    expect(hasChapter).toBeTruthy();
  });

  it("keeps the relative order of the playlist items", async () => {
    const playlist = await createPlaylist();
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, playableId: playable1.id, order: 15 },
      { playlistId: playlist.id, playableId: playable2.id, order: 14 },
    ]);

    await supertest(express)
      .post(`/playlists/${playlist.id}/queue`)
      .expect(201);

    const playFirst = await PlayQueue.findOne({ order: ["order"] });
    const playSecond = await PlayQueue.findOne({ order: ["order"], offset: 1 });

    expect(playFirst?.order).toEqual(1);
    expect(playSecond?.order).toEqual(2);
  });
});
