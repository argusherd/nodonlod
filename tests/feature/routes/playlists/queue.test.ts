import PlayQueue from "@/database/models/play-queue";
import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
} from "../../setup/create-model";

describe("The queue playlist route", () => {
  it("adds all the playlist items to the play queue", async () => {
    const playlist = await createPlaylist();
    const medium = await createMedium();
    const chapter = await createChapter();

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, mediumId: medium.id },
      {
        playlistId: playlist.id,
        mediumId: chapter.mediumId,
        chapterId: chapter.id,
      },
    ]);

    await supertest(express)
      .post(`/playlists/${playlist.id}/queue`)
      .expect(201);

    expect(await PlayQueue.count()).toEqual(2);

    const hasMedium = await PlayQueue.count({
      where: { mediumId: medium.id },
    });
    const hasChapter = await PlayQueue.count({
      where: { mediumId: chapter.mediumId, chapterId: chapter.id },
    });

    expect(hasMedium).toBeTruthy();
    expect(hasChapter).toBeTruthy();
  });

  it("keeps the relative order of the playlist items", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, mediumId: medium1.id, order: 15 },
      { playlistId: playlist.id, mediumId: medium2.id, order: 14 },
    ]);

    await supertest(express)
      .post(`/playlists/${playlist.id}/queue`)
      .expect(201);

    const playFirst = await PlayQueue.findOne({ order: ["order"] });
    const playSecond = await PlayQueue.findOne({ order: ["order"], offset: 1 });

    expect(playFirst?.order).toEqual(1);
    expect(playSecond?.order).toEqual(2);
  });

  it("triggers htmx to reload the play queue list via the header", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/playlists/${playlist.id}/queue`)
      .expect("HX-Trigger", "play-queue");
  });
});
