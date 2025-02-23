import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
} from "../../../setup/create-model";

describe("The playlist items index page", () => {
  it("lists all related media and chapters", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const chapter = await createChapter();
    const fromChapter = await chapter.$get("medium");

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, mediumId: medium1.id },
      { playlistId: playlist.id, mediumId: medium2.id },
      {
        playlistId: playlist.id,
        mediumId: chapter.mediumId,
        chapterId: chapter.id,
      },
    ]);

    await supertest(express)
      .get(`/playlists/${playlist.id}/playlist-items`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(`/media/${medium1.id}`);
        expect(res.text).toContain(medium2.title);
        expect(res.text).toContain(`/media/${medium2.id}`);
        expect(res.text).toContain(chapter.title);
        expect(res.text).toContain(fromChapter?.title);
        expect(res.text).toContain(`/media/${fromChapter?.id}/chapters`);
      });
  });

  it("lists all related media and chapters based on their ordering value", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const chapter = await createChapter();

    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium1.id,
      order: 100,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium2.id,
      order: 10,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: chapter.mediumId,
      chapterId: chapter.id,
      order: 1,
    });

    const displayOrder = new RegExp(
      `.*${chapter.title}.*${medium2.title}.*${medium1.title}.*`,
    );

    await supertest(express)
      .get(`/playlists/${playlist.id}/playlist-items`)
      .expect(200)
      .expect((res) => {
        expect(res.text.match(displayOrder)).not.toBeNull();
      });
  });

  it("can request the list part of the page", async () => {
    const playlist = await createPlaylist();
    const medium = await createMedium();
    const chapter = await createChapter();
    const fromChapter = await chapter.$get("medium");

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, mediumId: medium.id },
      {
        playlistId: playlist.id,
        mediumId: chapter.mediumId,
        chapterId: chapter.id,
      },
    ]);

    await supertest(express)
      .get(`/playlists/${playlist.id}/playlist-items?_list`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium.title);
        expect(res.text).toContain(`/media/${medium.id}`);
        expect(res.text).toContain(chapter.title);
        expect(res.text).toContain(fromChapter?.title);
        expect(res.text).toContain(`/media/${fromChapter?.id}`);
      });
  });
});
