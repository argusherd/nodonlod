import Category from "@/database/models/category";
import Label from "@/database/models/label";

describe("The label model", () => {
  it("belongs to a category", async () => {
    const category = await Category.create({ name: "foo", type: "string" });
    const label = await Label.create({ categoryId: category.id, text: "bar" });
    const belongsTo = await label.$get("category");

    expect(belongsTo?.id).toEqual(category.id);
  });
});
