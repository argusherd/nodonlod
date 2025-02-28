import Playlistable from "@/database/models/playlistable";
import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import supertest from "supertest";
import { createPlaylistable } from "../../../setup/create-model";

describe("The playlist item play route", () => {
  it("instructs the application to play the item from a playlist", async () => {
    const playlistable = await createPlaylistable();
    const calledWith = await Playlistable.findOne();
    const mockedPlay = jest.spyOn(playModule, "play").mockImplementation();

    await supertest(express)
      .get(
        `/playlists/${playlistable.playlistId}/playlistables/${playlistable.id}/play`,
      )
      .expect(202)
      .expect("HX-Trigger", "show-playing");

    expect(mockedPlay).toHaveBeenCalledWith(calledWith);
  });
});
