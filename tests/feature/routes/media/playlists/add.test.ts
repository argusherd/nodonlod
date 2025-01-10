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
        console.log(res.headers);
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlists");
      });

    const playlists = await medium.$get("playlists");

    expect(playlists).toHaveLength(1);
    expect(playlists.at(0)?.title).toEqual(playlist.title);
  });
});
