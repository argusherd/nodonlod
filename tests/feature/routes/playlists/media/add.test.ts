import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The playlist medium add route", () => {
  it("has a dedicated add page", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await supertest(express)
      .get(`/playlists/${playlist.id}/media/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          `/playlists/${playlist.id}/media/${medium1.id}`,
        );
        expect(res.text).toContain(
          `/playlists/${playlist.id}/media/${medium2.id}`,
        );
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
      });
  });

  it("can filter available media by title", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium({ title: "foo" });
    const medium2 = await createMedium({ title: "bar" });

    await supertest(express)
      .get(`/playlists/${playlist.id}/media/add?search=${medium2.title}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
      });
  });

  it("establishes the relationship between the playlist and the medium", async () => {
    const playlist = await createPlaylist();
    const medium = await createMedium();

    await supertest(express)
      .post(`/playlists/${playlist.id}/media/${medium.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlistables");
      });

    const playlistables = await playlist.$get("playlistables");

    expect(playlistables).toHaveLength(1);
    expect(playlistables.at(0)?.mediumId).toEqual(medium.id);
    expect(playlistables.at(0)?.order).toEqual(1);
  });
});
