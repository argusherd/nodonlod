import PlayQueue from "@/database/models/play-queue";
import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import wss from "@/routes/websocket";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
} from "../../setup/create-model";

describe("The playlist play route", () => {
  it("instructs the media player to play the first item of the playlist", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium1.id,
      order: 2,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium2.id,
      order: 1,
    });

    const mockedPlay = jest.fn();
    const mockedNowPlaying = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);
    jest.spyOn(wss, "nowPlaying").mockImplementation(mockedNowPlaying);

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(medium2.url);
    expect(mockedNowPlaying).toHaveBeenCalledWith({ title: medium2.title });
  });

  it("tells the htmx to refresh the play queue view", async () => {
    const playlist = await createPlaylist();

    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: (await createMedium()).id,
      order: 2,
    });

    await supertest(express)
      .get(`/playlists/${playlist.id}/play`)
      .expect(202)
      .expect("HX-Trigger", "play-queue");
  });

  it("does nothing if there are no items in the playlist", async () => {
    const playlist = await createPlaylist();

    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    expect(mockedPlay).not.toHaveBeenCalled();
  });

  it("puts other items in the playlist into the play queue", async () => {
    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium1.id,
      order: 2,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium2.id,
      order: 1,
    });

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    expect(await PlayQueue.count()).toEqual(1);

    const playQueue = await PlayQueue.findOne();

    expect(playQueue?.mediumId).toEqual(medium1.id);
  });

  it("increases the order number when other items are added to the play queue", async () => {
    const queued = await createMedium();

    await PlayQueue.create({ mediumId: queued.id, order: 10 });

    const playlist = await createPlaylist();
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const medium3 = await createMedium();

    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium1.id,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium2.id,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: medium3.id,
    });

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    expect(await PlayQueue.max("order")).toEqual(12);
  });

  it("can also play and queue chapters in the playlist", async () => {
    const playlist = await createPlaylist();
    const medium = await createMedium();
    const chapter1 = await createChapter({
      mediumId: medium.id,
      startTime: 123,
      endTime: 456,
    });
    const chapter2 = await createChapter();

    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: chapter1.mediumId,
      chapterId: chapter1.id,
      order: 1,
    });
    await PlaylistItem.create({
      playlistId: playlist.id,
      mediumId: chapter2.mediumId,
      chapterId: chapter2.id,
      order: 2,
    });

    const mockedPlay = jest.fn();
    const mockedNowPlaying = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);
    jest.spyOn(wss, "nowPlaying").mockImplementation(mockedNowPlaying);

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    const playQueue = await PlayQueue.findOne();

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 123, 456);
    expect(mockedNowPlaying).toHaveBeenCalledWith({
      title: medium.title,
      chapter: chapter1.title,
      startTime: 123,
      endTime: 456,
    });
    expect(playQueue?.chapterId).toEqual(chapter2.id);
  });
});
