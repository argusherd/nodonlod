import PlaylistItem from "@/database/models/playlist-item";
import RawInfoConverter from "@/src/raw-info-converter";
import { createMedium, createPlaylist } from "../../setup/create-model";

describe("The createAssociation method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("establishes a relationship between the playlist and the media", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [medium]);

    expect(await PlaylistItem.count()).toEqual(1);

    const playlistItem = await PlaylistItem.findOne();

    expect(playlistItem?.mediumId).toEqual(medium?.id);
    expect(playlistItem?.playlistId).toEqual(playlist?.id);
  });

  it("does not create two identical records when establishing the relationship between the playlist and media", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [medium]);
    await converter.createAssociation(playlist, [medium]);

    expect(await PlaylistItem.count()).toEqual(1);
  });

  it("preserves the order of the media when establishing the relationship between the playlist and media", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [medium], [21]);

    const playlistItem = await PlaylistItem.findOne();

    expect(playlistItem?.order).toEqual(21);
  });

  it("updates the order of the media when establishing the existing relationship", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [medium], [21]);
    await converter.createAssociation(playlist, [medium], [60]);

    const playlistItem = await PlaylistItem.findOne();

    expect(playlistItem?.order).toEqual(60);
  });
});
