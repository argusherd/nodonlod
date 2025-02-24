import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The medium playlist add route", () => {
  it("establishes a relationship between the medium and the playlist", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/media/${medium.id}/playlists/${playlist.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlists");
      });

    const playlists = await medium.$get("playlists");

    expect(playlists).toHaveLength(1);
    expect(playlists.at(0)?.title).toEqual(playlist.title);
  });

  it("has the largest order number in the playlist", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const playlist = await createPlaylist();

    await supertest(express)
      .post(`/media/${medium1.id}/playlists/${playlist.id}`)
      .expect(205);

    await supertest(express)
      .post(`/media/${medium2.id}/playlists/${playlist.id}`)
      .expect(205);

    const item1 = await PlaylistItem.findOne({
      where: { mediumId: medium1.id },
    });
    const item2 = await PlaylistItem.findOne({
      where: { mediumId: medium2.id },
    });

    expect(item1?.order).toEqual(1);
    expect(item2?.order).toEqual(2);
  });

  it("does not update the order if the medium already in the playlist", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const medium3 = await createMedium();
    const playlist = await createPlaylist();

    await PlaylistItem.bulkCreate([
      { playlistId: playlist.id, mediumId: medium1.id, order: 1 },
      { playlistId: playlist.id, mediumId: medium2.id, order: 2 },
      { playlistId: playlist.id, mediumId: medium3.id, order: 3 },
    ]);

    await supertest(express)
      .post(`/media/${medium2.id}/playlists/${playlist.id}`)
      .expect(205);

    const item = await PlaylistItem.findOne({
      where: { mediumId: medium2.id },
    });

    expect(item?.order).toEqual(2);
  });
});
