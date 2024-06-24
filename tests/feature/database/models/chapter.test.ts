import Chapter from "@/database/models/chapter";
import { createMedium } from "../../setup/create-model";

describe("The chapter model", () => {
  it("belongs to a medium", async () => {
    const medium = await createMedium();

    const chapter = await Chapter.create({
      mediumId: medium.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    const belongsTo = await chapter.$get("medium");

    expect(belongsTo?.id).toEqual(medium.id);
  });

  it("treats the mediumId, startTime, and endTime columns as an unique set", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await Chapter.create({
      mediumId: medium1.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    await Chapter.create({
      mediumId: medium1.id,
      title: "ep1",
      endTime: 120,
    });

    await Chapter.create({
      mediumId: medium2.id,
      title: "ep1",
      startTime: 20,
      endTime: 120,
    });

    await expect(
      Chapter.create({
        mediumId: medium1.id,
        title: "ep1",
        startTime: 20,
        endTime: 120,
      }),
    ).rejects.toThrow();
  });
});
