import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPlayQueue } from "../../setup/create-model";

describe("The play queue destroy route", () => {
  it("can delete all items in the play queue", async () => {
    await PlayQueue.create({
      mediumId: (await createMedium()).id,
    });

    await supertest(express)
      .delete("/play-queues")
      .expect(204)
      .expect("HX-Trigger", "refresh-play-queues");

    expect(await PlayQueue.count()).toEqual(0);
  });

  it("can delete an item in the play queue", async () => {
    const playQueue = await PlayQueue.create({
      mediumId: (await createMedium()).id,
    });

    await supertest(express).delete(`/play-queues/${playQueue.id}`).expect(205);

    expect(await PlayQueue.count()).toEqual(0);
  });

  it("decreases the order of the items by 1 if their order is greater than the item", async () => {
    const remain1 = await createPlayQueue({ order: 1 });
    const target = await createPlayQueue({ order: 2 });
    const shouldBe2 = await createPlayQueue({ order: 3 });

    await supertest(express).delete(`/play-queues/${target.id}`).expect(205);

    await remain1.reload();
    await shouldBe2.reload();

    expect(remain1.order).toEqual(1);
    expect(shouldBe2.order).toEqual(2);
  });

  it("can display a confirmation message for deletion", async () => {
    await supertest(express)
      .delete("/play-queues/confirm")
      .expect(200)
      .expect("HX-Trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to delete all items in the play queue?",
        );
        expect(res.text).toContain("/play-queues");
      });
  });
});
