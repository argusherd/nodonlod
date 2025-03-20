import Labelable from "@/database/models/labelable";
import {
  createLabel,
  createMedium,
  createPerformer,
} from "../../setup/create-model";

describe("The performer model", () => {
  it("can belong to many media", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();

    await performer.$add("medium", medium);

    const BelongsToMany = await performer.$get("media");

    expect(BelongsToMany).toHaveLength(1);
    expect(BelongsToMany.at(0)?.id).toEqual(medium.id);
  });

  it("can belong to many labels", async () => {
    const performer = await createPerformer();
    const label1 = await createLabel();
    const label2 = await createLabel();

    await performer.$add("label", [label1, label2]);

    const labelIds = (await performer.$get("labels")).map((label) => label.id);
    const labelable = await Labelable.findOne();

    expect(labelIds).toHaveLength(2);
    expect(labelIds).toContain(label1.id);
    expect(labelIds).toContain(label2.id);
    expect(labelable?.labelableType).toEqual("performer");
  });
});
