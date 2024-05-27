import PlaylistItem from "@/database/models/playlist-item";
import RawInfoConverter from "@/src/raw-info-converter";
import { createPlayable, createPlaylist } from "../../setup/create-model";

describe("The createAssociation method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("establishes a relationship between the playlist and the playables", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable]);

    expect(await PlaylistItem.count()).toEqual(1);

    const playlistItem = await PlaylistItem.findOne();

    expect(playlistItem?.playableId).toEqual(playable?.id);
    expect(playlistItem?.playlistId).toEqual(playlist?.id);
  });

  it("does not create two identical records when establishing the relationship between the playlist and playables", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable]);
    await converter.createAssociation(playlist, [playable]);

    expect(await PlaylistItem.count()).toEqual(1);
  });

  it("preserves the order of the playables when establishing the relationship between the playlist and playables", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable], [21]);

    const playlistItem = await PlaylistItem.findOne();

    expect(playlistItem?.order).toEqual(21);
  });

  it("updates the order of the playables when establishing the existing relationship", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable], [21]);
    await converter.createAssociation(playlist, [playable], [60]);

    const playlistItem = await PlaylistItem.findOne();

    expect(playlistItem?.order).toEqual(60);
  });
});
