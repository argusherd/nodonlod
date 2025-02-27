import express from "@/routes";
import supertest from "supertest";
import {
  createPlaylist,
  createPlaylistItem,
} from "../../../setup/create-model";

describe("The playlist item sort route", () => {
  it("needs a parameter to set the item's new order", async () => {
    const playlistItem = await createPlaylistItem();

    await supertest(express)
      .put(
        `/playlists/${playlistItem.playlistId}/playlist-items/${playlistItem.id}`,
      )
      .expect(422);
  });

  it("sets the playlist item's order", async () => {
    const playlistId = (await createPlaylist()).id;
    const shouldBe2 = await createPlaylistItem({ order: 1, playlistId });
    const target = await createPlaylistItem({ order: 2, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${target.id}`)
      .type("form")
      .send({ order: 1 })
      .expect(205)
      .expect("hx-trigger", "refresh-playlist-items");

    await target.reload();
    await shouldBe2.reload();

    expect(target.order).toEqual(1);
    expect(shouldBe2.order).toEqual(2);
  });

  it("decreases the order of items by 1 whose order is lower than or equal to but not lower than the original order", async () => {
    const playlistId = (await createPlaylist()).id;
    const remain1 = await createPlaylistItem({ order: 1, playlistId });
    const target = await createPlaylistItem({ order: 2, playlistId });
    const shouldBe2 = await createPlaylistItem({ order: 3, playlistId });
    const shouldBe3 = await createPlaylistItem({ order: 4, playlistId });
    const remain5 = await createPlaylistItem({ order: 5, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${target.id}`)
      .type("form")
      .send({ order: 4 })
      .expect(205);

    await shouldBe2.reload();
    await shouldBe3.reload();
    await remain1.reload();
    await remain5.reload();

    expect(shouldBe2.order).toEqual(2);
    expect(shouldBe3.order).toEqual(3);
    expect(remain1.order).toEqual(1);
    expect(remain5.order).toEqual(5);
  });

  it("increases the order of items whose order is greater than or equal to the given order", async () => {
    const playlistId = (await createPlaylist()).id;
    const remain1 = await createPlaylistItem({ order: 1, playlistId });
    const shouldBe3 = await createPlaylistItem({ order: 2, playlistId });
    const shouldBe4 = await createPlaylistItem({ order: 3, playlistId });
    const target = await createPlaylistItem({ order: 4, playlistId });
    const remain5 = await createPlaylistItem({ order: 5, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${target.id}`)
      .type("form")
      .send({ order: 2 })
      .expect(205);

    await shouldBe3.reload();
    await shouldBe4.reload();
    await remain1.reload();
    await remain5.reload();

    expect(shouldBe3.order).toEqual(3);
    expect(shouldBe4.order).toEqual(4);
    expect(remain1.order).toEqual(1);
    expect(remain5.order).toEqual(5);
  });

  it("does not reorder numbers below 0", async () => {
    const playlistId = (await createPlaylist()).id;
    const shouldBe2 = await createPlaylistItem({ order: 1, playlistId });
    const target = await createPlaylistItem({ order: 2, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${target.id}`)
      .type("form")
      .send({ order: -1 })
      .expect(205);

    await shouldBe2.reload();
    await target.reload();

    expect(target.order).toEqual(1);
    expect(shouldBe2.order).toEqual(2);
  });

  it("does not exceed the length of the playlist when reordering numbers", async () => {
    const playlistId = (await createPlaylist()).id;
    const target = await createPlaylistItem({ order: 1, playlistId });
    const shouldBe1 = await createPlaylistItem({ order: 2, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${target.id}`)
      .type("form")
      .send({ order: 99 })
      .expect(205);

    await shouldBe1.reload();
    await target.reload();

    expect(target.order).toEqual(2);
    expect(shouldBe1.order).toEqual(1);
  });

  it("can manully fix duplicated order number", async () => {
    const playlistId = (await createPlaylist()).id;
    const remain1 = await createPlaylistItem({ order: 1, playlistId });
    const shouldBe3 = await createPlaylistItem({ order: 2, playlistId });
    const remain2 = await createPlaylistItem({ order: 2, playlistId });
    const remain4 = await createPlaylistItem({ order: 4, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${shouldBe3.id}`)
      .type("form")
      .send({ order: 3 })
      .expect(205);

    await remain1.reload();
    await shouldBe3.reload();
    await remain2.reload();
    await remain4.reload();

    expect(remain1.order).toEqual(1);
    expect(shouldBe3.order).toEqual(3);
    expect(remain2.order).toEqual(2);
    expect(remain4.order).toEqual(4);
  });

  it("reorders all the items in the same playlist", async () => {
    const playlistId = (await createPlaylist()).id;
    const became1 = await createPlaylistItem({ order: 6969, playlistId });
    const became2 = await createPlaylistItem({ order: 69, playlistId });

    await supertest(express)
      .put(`/playlists/${playlistId}/playlist-items/${became1.id}`)
      .type("form")
      .send({ order: 69 })
      .expect(205);

    await became1.reload();
    await became2.reload();

    expect(became1.order).toEqual(1);
    expect(became2.order).toEqual(2);
  });
});
