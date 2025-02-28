import Playlistable from "@/database/models/playlistable";
import express from "@/routes";
import supertest from "supertest";
import {
  createPlaylist,
  createPlaylistable,
} from "../../../setup/create-model";

describe("The playlist item destroy route", () => {
  it("has a dedicated confirm page", async () => {
    const playlistable = await createPlaylistable();
    const playlistId = playlistable.playlistId;

    await supertest(express)
      .delete(
        `/playlists/${playlistId}/playlistables/${playlistable.id}/confirm`,
      )
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain("Are you sure you want to delete this item");
        expect(res.text).toContain(
          `/playlists/${playlistId}/playlistables/${playlistable.id}`,
        );
      });
  });

  it("removes the relationship between the playlist and the playlistable item", async () => {
    const playlistable = await createPlaylistable();

    await supertest(express)
      .delete(
        `/playlists/${playlistable.playlistId}/playlistables/${playlistable.id}`,
      )
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-playlistables");
      });

    expect(await Playlistable.count()).toEqual(0);
  });

  it("decreases the order of other items by 1", async () => {
    const playlist = await createPlaylist();
    const remain1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });
    const removed = await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });
    const shouldBe2 = await createPlaylistable({
      playlistId: playlist.id,
      order: 3,
    });
    const belongOtherPlaylist = await createPlaylistable({ order: 3 });

    await supertest(express)
      .delete(`/playlists/${playlist.id}/playlistables/${removed.id}`)
      .expect(205);

    await remain1.reload();
    await shouldBe2.reload();
    await belongOtherPlaylist.reload();

    expect(remain1.order).toEqual(1);
    expect(shouldBe2.order).toEqual(2);
    expect(belongOtherPlaylist.order).toEqual(3);
  });
});
