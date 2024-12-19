import express from "@/routes";
import { play } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
  createPlaylistItem,
} from "../../setup/create-model";

describe("The show play route", () => {
  beforeAll(() => {
    jest.spyOn(mediaPlayer, "play").mockImplementation(jest.fn());
  });

  it("displays the currently playing medium", async () => {
    const medium = await createMedium({ description: "foo" });

    await play(medium);

    await supertest(express)
      .get("/play")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium.title);
        expect(res.text).toContain(medium.description);
        expect(res.text).toContain(`/media/${medium.id}`);
      });
  });

  it("displays the currently playing chapter", async () => {
    const chapter = await createChapter({ endTime: 114514 });

    await play(chapter);

    await supertest(express)
      .get("/play")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(chapter.title);
        expect(res.text).toContain(`/media/${chapter.mediumId}`);
        expect(res.text).toContain("114514");
      });
  });

  it("can provide a link to the currently playing item in the playlist", async () => {
    const playlist = await createPlaylist({ thumbnail: "foobar" });
    const playlistItem = await createPlaylistItem({ playlistId: playlist.id });

    await play(playlistItem);

    await supertest(express)
      .get("/play")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist.thumbnail);
        expect(res.text).toContain(`/playlists/${playlistItem.playlistId}`);
      });
  });
});
