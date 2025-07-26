import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
  createPlaylistable,
} from "../../../setup/create-model";

describe("The playlist item play route", () => {
  it("instructs the application to play the item from a playlist", async () => {
    const medium = await createMedium();
    const playlistable = await createPlaylistable({ mediumId: medium.id });
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express)
      .get(
        `/playlists/${playlistable.playlistId}/playlistables/${playlistable.id}/play`,
      )
      .expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, undefined, undefined);
  });

  it("sets start time and end time if the playlistable associated a chapter", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      startTime: 10,
      endTime: 20,
      mediumId: medium.id,
    });
    const playlistable = await createPlaylistable({
      mediumId: medium.id,
      chapterId: chapter.id,
    });
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express)
      .get(
        `/playlists/${playlistable.playlistId}/playlistables/${playlistable.id}/play`,
      )
      .expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 20);
  });

  it("displays the current medium and current chapter playing", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      startTime: 10,
      endTime: 20,
      mediumId: medium.id,
    });
    const playlistable = await createPlaylistable({
      mediumId: medium.id,
      chapterId: chapter.id,
    });

    jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .get(
        `/playlists/${playlistable.playlistId}/playlistables/${playlistable.id}/play`,
      )
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium.title);
        expect(res.text).toContain(chapter.title);
      });
  });

  it("displays the thumbnail from the given playlist", async () => {
    const playlist = await createPlaylist({
      thumbnail: "https://foo.com/bar.jpg",
    });
    const playlistable = await createPlaylistable({ playlistId: playlist.id });

    await supertest(express)
      .get(
        `/playlists/${playlistable.playlistId}/playlistables/${playlistable.id}/play`,
      )
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("https://foo.com/bar.jpg");
      });
  });

  it("displays the next playlistable you can play", async () => {
    const playlist = await createPlaylist();
    const playlistable1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });
    const playlistable2 = await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });

    await supertest(express)
      .get(
        `/playlists/${playlistable1.playlistId}/playlistables/${playlistable1.id}/play`,
      )
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          `/playlists/${playlist.id}/playlistables/${playlistable2.id}/play`,
        );
      });
  });

  it("gives the first item in the playlist if the current playlistable is the last one", async () => {
    const playlist = await createPlaylist();
    const firstOne = await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });
    await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });
    const lastOne = await createPlaylistable({
      playlistId: playlist.id,
      order: 3,
    });

    await supertest(express)
      .get(`/playlists/${lastOne.playlistId}/playlistables/${lastOne.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          `/playlists/${playlist.id}/playlistables/${firstOne.id}/play`,
        );
      });
  });
});
