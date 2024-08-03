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
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [medium1, medium2]);

    const playlistItem1 = await PlaylistItem.findOne({
      where: { mediumId: medium1.id },
    });
    const playlistItem2 = await PlaylistItem.findOne({
      where: { mediumId: medium2.id },
    });

    expect(playlistItem1?.order).toEqual(1);
    expect(playlistItem2?.order).toEqual(2);
  });

  it("continues the order of the media when establishing the existing relationship", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const medium3 = await createMedium();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [medium1, medium2]);
    await converter.createAssociation(playlist, [medium3]);

    const playlistItem = await PlaylistItem.findOne({
      where: { mediumId: medium3.id },
    });

    expect(playlistItem?.order).toEqual(3);
  });
});
