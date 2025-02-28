import Playlistable from "@/database/models/playlistable";
import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import supertest from "supertest";
import { createPlaylist, createPlaylistable } from "../../setup/create-model";

describe("The playlist play route", () => {
  it("instructs the media player to play the first item of the playlist", async () => {
    const playlist = await createPlaylist();
    await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });

    const mockedPlay = jest.spyOn(playModule, "play").mockImplementation();
    const playlistable = await Playlistable.findOne();

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(playlistable);
  });

  it("does nothing if there are no items in the playlist", async () => {
    const playlist = await createPlaylist();

    const mockedPlay = jest.spyOn(playModule, "play").mockImplementation();

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(null);
  });
});
