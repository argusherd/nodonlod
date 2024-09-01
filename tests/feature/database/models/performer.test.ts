import Performer from "@/database/models/performer";
import { createMedium } from "../../setup/create-model";

describe("The performer model", () => {
  it("can belong to many media", async () => {
    const performer = await Performer.create({ name: "foo" });
    const medium = await createMedium();

    await performer.$add("medium", medium);

    const BelongsToMany = await performer.$get("media");

    expect(BelongsToMany).toHaveLength(1);
    expect(BelongsToMany.at(0)?.id).toEqual(medium.id);
  });
});
