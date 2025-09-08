import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlaylist } from "../../../setup/create-model";

describe("The playlist medium store route", () => {
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
