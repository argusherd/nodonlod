import express from "@/routes";
import supertest from "supertest";
import { createPlayable, createPlaylist } from "../../setup/create-playable";

describe("The playlist show page", () => {
  it("can only be accessed with an existing playlist", async () => {
    await supertest(express).get("/playlists/NOT_EXIST").expect(404);
  });

  it("displays the information of the playlist", async () => {
    const playlist = await createPlaylist();

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist.title);
      });
  });

  it("lists all related playables", async () => {
    const playlist = await createPlaylist();
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await playlist.$set("playables", [playable1, playable2]);

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playable1.title);
        expect(res.text).toContain(`/playables/${playable1.id}`);
        expect(res.text).toContain(playable2.title);
        expect(res.text).toContain(`/playables/${playable2.id}`);
      });
  });

  it("lists all related playables based on their ordering value", async () => {
    const playlist = await createPlaylist();
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await playlist.$add("playable", playable1, { through: { order: 50 } });
    await playlist.$add("playable", playable2, { through: { order: 49 } });

    const secondGoFirst = new RegExp(
      `.*${playable2.title}.*${playable1.title}.*`,
    );

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text.match(secondGoFirst)).not.toBeNull();
      });
  });
});
