import Uploader from "@/database/models/uploader";
import { createPlayable } from "../../setup/create-playable";

describe("The uploader model", () => {
  it("can has many playables", async () => {
    const uploader = await Uploader.create({
      url: "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
      name: "Rick Astley",
    });

    const playable = await createPlayable({ uploaderId: uploader.id });

    const hasMany = await uploader.$get("playables");

    expect(hasMany).toHaveLength(1);
    expect(hasMany.at(0)?.id).toEqual(playable.id);
  });
});
