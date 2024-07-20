import Playlist from "@/database/models/playlist";
import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createPlaylist } from "../../setup/create-model";

describe("The playlist index page", () => {
  it("lists playlists and provides a link for each playlist", async () => {
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await supertest(express)
      .get("/playlists")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/playlists/${playlist1.id}`);
        expect(res.text).toContain(`/playlists/${playlist2.id}`);
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(playlist2.title);
      });
  });

  it("lists 10 playlists based on the createdAt column in descending order per page", async () => {
    const inFirstPage: Playlist[] = [];
    const inSecondPage = await createPlaylist({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });

    for (let i = 0; i < 10; i++) inFirstPage.push(await createPlaylist());

    await supertest(express)
      .get("/playlists")
      .expect(200)
      .expect((res) => {
        for (const playlist of inFirstPage)
          expect(res.text).toContain(playlist.id);

        expect(res.text).not.toContain(inSecondPage.id);
      });

    await supertest(express)
      .get("/playlists?page=2")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(inSecondPage.id);

        for (const playlist of inFirstPage)
          expect(res.text).not.toContain(playlist.id);
      });
  });
});
