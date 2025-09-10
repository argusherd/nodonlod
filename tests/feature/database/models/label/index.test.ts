import Labelable from "@/database/models/labelable";
import {
  createLabel,
  createMedium,
  createPerformer,
  createPlaylist,
} from "../../../setup/create-model";

describe("The label model", () => {
  it("can belong to many media", async () => {
    const label = await createLabel();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await label.$add("medium", [medium1, medium2]);

    const mediumIds = (await label.$get("media")).map((medium) => medium.id);
    const labelable = await Labelable.findOne();

    expect(mediumIds).toHaveLength(2);
    expect(mediumIds).toContain(medium1.id);
    expect(mediumIds).toContain(medium2.id);
    expect(labelable?.labelableType).toEqual("medium");
  });

  it("can belong to many playlists", async () => {
    const label = await createLabel();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await label.$add("playlist", [playlist1, playlist2]);

    const playlistIds = (await label.$get("playlists")).map(
      (playlist) => playlist.id,
    );
    const labelable = await Labelable.findOne();

    expect(playlistIds).toHaveLength(2);
    expect(playlistIds).toContain(playlist1.id);
    expect(playlistIds).toContain(playlist2.id);
    expect(labelable?.labelableType).toEqual("playlist");
  });

  it("can belong to many performers", async () => {
    const label = await createLabel();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await label.$add("performer", [performer1, performer2]);

    const performerIds = (await label.$get("performers")).map(
      (performer) => performer.id,
    );
    const labelable = await Labelable.findOne();

    expect(performerIds).toHaveLength(2);
    expect(performerIds).toContain(performer1.id);
    expect(performerIds).toContain(performer2.id);
    expect(labelable?.labelableType).toEqual("performer");
  });
});
