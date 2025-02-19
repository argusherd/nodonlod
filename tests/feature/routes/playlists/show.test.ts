import express from "@/routes";
import supertest from "supertest";
import { createPlaylist } from "../../setup/create-model";

describe("The playlist show page", () => {
  it("can only be accessed with an existing playlist", async () => {
    await supertest(express).get("/playlists/NOT_EXIST").expect(404);
  });

  it("displays the information of the playlist", async () => {
    const playlist = await createPlaylist({
      description: "foo",
      thumbnail: "https://foo.bar/image",
    });

    await supertest(express)
      .get(`/playlists/${playlist.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist.title);
        expect(res.text).toContain("foo");
        expect(res.text).toContain("https://foo.bar/image");
      });
  });
});
