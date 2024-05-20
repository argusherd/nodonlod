import { createPlayable, createUploader } from "../../setup/create-model";

describe("The uploader model", () => {
  it("can has many playables", async () => {
    const uploader = await createUploader();

    const playable = await createPlayable({ uploaderId: uploader.id });

    const hasMany = await uploader.$get("playables");

    expect(hasMany).toHaveLength(1);
    expect(hasMany.at(0)?.id).toEqual(playable.id);
  });
});
