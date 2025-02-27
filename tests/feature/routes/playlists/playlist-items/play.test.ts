import PlaylistItem from "@/database/models/playlist-item";
import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import supertest from "supertest";
import { createPlaylistItem } from "../../../setup/create-model";

describe("The playlist item play route", () => {
  it("instructs the application to play the item from a playlist", async () => {
    const playlistItem = await createPlaylistItem();
    const calledWith = await PlaylistItem.findOne();
    const mockedPlay = jest.spyOn(playModule, "play").mockImplementation();

    await supertest(express)
      .get(
        `/playlists/${playlistItem.playlistId}/playlist-items/${playlistItem.id}/play`,
      )
      .expect(202)
      .expect("HX-Trigger", "show-playing");

    expect(mockedPlay).toHaveBeenCalledWith(calledWith);
  });
});
