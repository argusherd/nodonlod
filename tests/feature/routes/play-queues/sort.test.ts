import express from "@/routes";
import supertest from "supertest";
import { createPlayQueue } from "../../setup/create-model";

describe("The play queue sort route", () => {
  it("needs a parameter to set the item's new order", async () => {
    const playQueue = await createPlayQueue({ order: 1 });

    await supertest(express).put(`/play-queues/${playQueue.id}`).expect(422);
  });

  it("sets the queued item's order", async () => {
    const playQueue = await createPlayQueue({ order: 1 });

    await supertest(express)
      .put(`/play-queues/${playQueue.id}`)
      .type("form")
      .send({ order: 2 })
      .expect(205);

    await playQueue.reload();

    expect(playQueue.order).toEqual(2);
  });

  it("decreases the order of items by 1 whose order is lower than or equal to but not lower than the original order", async () => {
    const remain1 = await createPlayQueue({ order: 1 });
    const target = await createPlayQueue({ order: 2 });
    const shouldBe2 = await createPlayQueue({ order: 3 });
    const shouldBe3 = await createPlayQueue({ order: 4 });
    const remain5 = await createPlayQueue({ order: 5 });

    await supertest(express)
      .put(`/play-queues/${target.id}`)
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
    const remain1 = await createPlayQueue({ order: 1 });
    const shouldBe3 = await createPlayQueue({ order: 2 });
    const shouldBe4 = await createPlayQueue({ order: 3 });
    const target = await createPlayQueue({ order: 4 });
    const remain5 = await createPlayQueue({ order: 5 });

    await supertest(express)
      .put(`/play-queues/${target.id}`)
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
