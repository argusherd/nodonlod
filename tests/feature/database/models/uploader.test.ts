import { createMedium, createUploader } from "../../setup/create-model";

describe("The uploader model", () => {
  it("can has many media", async () => {
    const uploader = await createUploader();

    const medium = await createMedium({ uploaderId: uploader.id });

    const hasMany = await uploader.$get("media");

    expect(hasMany).toHaveLength(1);
    expect(hasMany.at(0)?.id).toEqual(medium.id);
  });
});
