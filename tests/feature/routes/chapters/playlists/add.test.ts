import Playlistable from "@/database/models/playlistable";
import express from "@/routes";
import supertest from "supertest";
import { createChapter, createPlaylist } from "../../../setup/create-model";

describe("The medium playlist add route", () => {
  it("displays all available playlists", async () => {
    const chapter = await createChapter();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get(`/chapters/${chapter.id}/playlists/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(
          `/chapters/${chapter.id}/playlists/${playlist1.id}`,
        );
        expect(res.text).toContain(playlist2.title);
        expect(res.text).toContain(
          `/chapters/${chapter.id}/playlists/${playlist2.id}`,
        );
      });
  });

  it("can search playlists by title or description", async () => {
    const chapter = await createChapter();
    const playlist1 = await createPlaylist({ title: "as foo 1" });
    const playlist2 = await createPlaylist({ description: "as bar 2" });

    await supertest(express)
      .get(`/chapters/${chapter.id}/playlists/add`)
      .query({ search: "foo" })
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.id);
        expect(res.text).not.toContain(playlist2.id);
      });

    await supertest(express)
      .get(`/chapters/${chapter.id}/playlists/add`)
      .query({ search: "bar" })
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(playlist1.id);
        expect(res.text).toContain(playlist2.id);
      });
  });

  it("establishes a relationship between the chapter and the playlist", async () => {
    const chapter = await createChapter();
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/chapters/${chapter.id}/playlists/${playlist.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-location"]).toContain(
          `/playlists/${playlist.id}/playlistables`,
        );
      });

    const playlistables = await Playlistable.findAll();

    expect(playlistables).toHaveLength(1);
    expect(playlistables.at(0)?.playlistId).toEqual(playlist.id);
    expect(playlistables.at(0)?.chapterId).toEqual(chapter.id);
  });

  it("has the largest order number in the playlist", async () => {
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/chapters/${chapter1.id}/playlists/${playlist.id}`)
      .expect(205);

    await supertest(express)
      .post(`/chapters/${chapter2.id}/playlists/${playlist.id}`)
      .expect(205);

    const playlistable1 = await Playlistable.findOne({
      where: { chapterId: chapter1.id },
    });
    const playlistable2 = await Playlistable.findOne({
      where: { chapterId: chapter2.id },
    });

    expect(playlistable1?.order).toEqual(1);
    expect(playlistable2?.order).toEqual(2);
  });

  it("does not update the order if the chapter already in the playlist", async () => {
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();
    const chapter3 = await createChapter();
    const playlist = await createPlaylist();

    await Playlistable.bulkCreate([
      {
        playlistId: playlist.id,
        mediumId: chapter1.mediumId,
        chapterId: chapter1.id,
        order: 1,
      },
      {
        playlistId: playlist.id,
        mediumId: chapter2.mediumId,
        chapterId: chapter2.id,
        order: 2,
      },
      {
        playlistId: playlist.id,
        mediumId: chapter3.mediumId,
        chapterId: chapter3.id,
        order: 3,
      },
    ]);

    await supertest(express)
      .post(`/chapters/${chapter2.id}/playlists/${playlist.id}`)
      .expect(205);

    const playlistable = await Playlistable.findOne({
      where: { chapterId: chapter2.id },
    });

    expect(playlistable?.order).toEqual(2);
  });
});
