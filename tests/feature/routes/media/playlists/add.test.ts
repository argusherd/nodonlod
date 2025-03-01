import Playlistable from "@/database/models/playlistable";
import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The medium playlist add route", () => {
  it("displays all available playlists", async () => {
    const medium = await createMedium();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get(`/media/${medium.id}/playlists/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
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
      .get(`/media/${medium.id}/playlists/add?title=${playlist1.title}`)
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

    const playlistable1 = await Playlistable.findOne({
      where: { mediumId: medium1.id },
    });
    const playlistable2 = await Playlistable.findOne({
      where: { mediumId: medium2.id },
    });

    expect(playlistable1?.order).toEqual(1);
    expect(playlistable2?.order).toEqual(2);
  });

  it("does not update the order if the medium already in the playlist", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const medium3 = await createMedium();
    const playlist = await createPlaylist();

    await Playlistable.bulkCreate([
      { playlistId: playlist.id, mediumId: medium1.id, order: 1 },
      { playlistId: playlist.id, mediumId: medium2.id, order: 2 },
      { playlistId: playlist.id, mediumId: medium3.id, order: 3 },
    ]);

    await supertest(express)
      .post(`/media/${medium2.id}/playlists/${playlist.id}`)
      .expect(205);

    const playlistable = await Playlistable.findOne({
      where: { mediumId: medium2.id },
    });

    expect(playlistable?.order).toEqual(2);
  });
});
