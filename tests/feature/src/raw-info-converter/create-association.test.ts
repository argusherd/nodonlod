import PlayablePlaylist from "@/database/models/playable-playlist";
import RawInfoConverter from "@/src/raw-info-converter";
import { createPlayable, createPlaylist } from "../../setup/create-playable";

describe("The createAssociation method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("establishes a relationship between the playlist and the playables", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable]);

    expect(await PlayablePlaylist.count()).toEqual(1);

    const playablePlaylist = await PlayablePlaylist.findOne();

    expect(playablePlaylist?.playableId).toEqual(playable?.id);
    expect(playablePlaylist?.playlistId).toEqual(playlist?.id);
  });

  it("does not create two identical records when establishing the relationship between the playlist and playables", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable]);
    await converter.createAssociation(playlist, [playable]);

    expect(await PlayablePlaylist.count()).toEqual(1);
  });

  it("preserves the order of the playables when establishing the relationship between the playlist and playables", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable], [21]);

    const playablePlaylist = await PlayablePlaylist.findOne();

    expect(playablePlaylist?.order).toEqual(21);
  });

  it("updates the order of the playables when establishing the existing relationship", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await converter.createAssociation(playlist, [playable], [21]);
    await converter.createAssociation(playlist, [playable], [60]);

    const playablePlaylist = await PlayablePlaylist.findOne();

    expect(playablePlaylist?.order).toEqual(60);
  });
});
