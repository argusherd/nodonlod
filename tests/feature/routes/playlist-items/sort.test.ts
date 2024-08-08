import express from "@/routes";
import supertest from "supertest";
import { createPlaylistItem } from "../../setup/create-model";

describe("The playlist item sort route", () => {
  it("needs a parameter to set the item's new order", async () => {
    const playlistItem = await createPlaylistItem();

    await supertest(express)
      .put(`/playlist-items/${playlistItem.id}`)
      .expect(422);
  });

  it("sets the playlist item's order", async () => {
    const playlistItem = await createPlaylistItem();

    await supertest(express)
      .put(`/playlist-items/${playlistItem.id}`)
      .type("form")
      .send({ order: 5 })
      .expect(205);

    await playlistItem.reload();

    expect(playlistItem.order).toEqual(5);
  });

  it("decreases the order of items by 1 whose order is lower than or equal to but not lower than the original order", async () => {
    const remain1 = await createPlaylistItem({ order: 1 });
    const target = await createPlaylistItem({ order: 2 });
    const shouldBe2 = await createPlaylistItem({ order: 3 });
    const shouldBe3 = await createPlaylistItem({ order: 4 });
    const remain5 = await createPlaylistItem({ order: 5 });

    await supertest(express)
      .put(`/playlist-items/${target.id}`)
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
    const remain1 = await createPlaylistItem({ order: 1 });
    const shouldBe3 = await createPlaylistItem({ order: 2 });
    const shouldBe4 = await createPlaylistItem({ order: 3 });
    const target = await createPlaylistItem({ order: 4 });
    const remain5 = await createPlaylistItem({ order: 5 });

    await supertest(express)
      .put(`/playlist-items/${target.id}`)
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
});
