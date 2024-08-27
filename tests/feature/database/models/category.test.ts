import Category from "@/database/models/category";
import Label from "@/database/models/label";

describe("The category model", () => {
  it("can has many labels", async () => {
    const category = await Category.create({ name: "foo", type: "string" });

    await category.$create("label", { text: "bar" });

    const label = await Label.findOne();

    expect(label?.text).toEqual("bar");
  });
});
