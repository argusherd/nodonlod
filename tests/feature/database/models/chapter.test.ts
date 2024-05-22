import Chapter from "@/database/models/chapter";
import { createPlayable } from "../../setup/create-model";

describe("The chapter model", () => {
  it("belongs to a playable", async () => {
    const playable = await createPlayable();

    const chapter = await Chapter.create({
      playableId: playable.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    const belongsTo = await chapter.$get("playable");

    expect(belongsTo?.id).toEqual(playable.id);
  });

  it("treats the playableId, startTime, and endTime columns as an unique set", async () => {
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await Chapter.create({
      playableId: playable1.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    await Chapter.create({
      playableId: playable1.id,
      title: "ep1",
      endTime: 120,
    });

    await Chapter.create({
      playableId: playable2.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    await expect(
      Chapter.create({
        playableId: playable1.id,
        title: "ep1",
        startTime: 20,
        endTime: 120,
      }),
    ).rejects.toThrow();
  });
});
