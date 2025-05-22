import express from "@/routes";
import supertest from "supertest";
import { createPlaylist } from "../../setup/create-model";

describe("The playlist rating route", () => {
  it("can set the rating of the playlist", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .put(`/playlists/${playlist.id}/rating`)
      .type("form")
      .send({ rating: 3 })
      .expect(204);

    await playlist.reload();

    expect(playlist.rating).toEqual(3);
  });

  it("can only set the rating between 1 to 5", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .put(`/playlists/${playlist.id}/rating`)
      .type("form")
      .send({ rating: 0 })
      .expect(422);

    await supertest(express)
      .put(`/playlists/${playlist.id}/rating`)
      .type("form")
      .send({ rating: 6 })
      .expect(422);

    await playlist.reload();

    expect(playlist.rating).toBeNull();
  });

  it("can reset the rating of the playlist", async () => {
    const playlist = await createPlaylist({ rating: 3 });

    await supertest(express)
      .put(`/playlists/${playlist.id}/rating`)
      .expect(204);

    await playlist.reload();

    expect(playlist.rating).toBeNull();
  });
});
