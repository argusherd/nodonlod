import sequelize from "@/database/connection";
import Playable from "@/database/models/playable";
import Playlist from "@/database/models/playlist";
import RawInfoConverter from "@/src/raw-info-converter";
import {
  createRawPlaylist,
  createSubRawPlayable,
} from "../../setup/create-raw-info";

describe("The fromRawplaylistAndEntries method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("calls the toPlaylist method with the provided raw-playlist", async () => {
    const mockedToPlaylist = jest
      .spyOn(converter, "toPlaylist")
      .mockImplementation();
    const rawPlaylist = createRawPlaylist();

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    expect(mockedToPlaylist).toHaveBeenCalledWith(rawPlaylist);
  });

  it("calls the toPlaylist method multiple times when providing a raw-playlist that contains raw-playlists", async () => {
    const mockedToPlaylist = jest
      .spyOn(converter, "toPlaylist")
      .mockImplementation();
    const nestedRawPlaylist1 = createRawPlaylist();
    const nestedRawPlaylist2 = createRawPlaylist();
    const rawPlaylist = createRawPlaylist({
      entries: [nestedRawPlaylist1, nestedRawPlaylist2],
    });

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    expect(mockedToPlaylist).toHaveBeenCalledTimes(3);
    expect(mockedToPlaylist).toHaveBeenNthCalledWith(1, rawPlaylist);
    expect(mockedToPlaylist).toHaveBeenNthCalledWith(2, nestedRawPlaylist1);
    expect(mockedToPlaylist).toHaveBeenNthCalledWith(3, nestedRawPlaylist2);
  });

  it("calls the toPlayable method when providing a raw-playlist that contains raw-playables", async () => {
    const mockedToPlaylist = jest
      .spyOn(converter, "toPlaylist")
      .mockImplementation();
    const mockedToPlayable = jest
      .spyOn(converter, "toPlayble")
      .mockImplementation();
    jest.spyOn(converter, "createAssociation").mockImplementation();

    const subRawPlayable1 = createSubRawPlayable();
    const subRawPlayable2 = createSubRawPlayable();
    const rawPlaylist = createRawPlaylist({
      entries: [subRawPlayable1, subRawPlayable2],
    });

    sequelize.options.logging = console.log;

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    sequelize.options.logging = undefined;
    expect(mockedToPlaylist).toHaveBeenCalledTimes(1);
    expect(mockedToPlayable).toHaveBeenCalledTimes(2);
    expect(mockedToPlaylist).toHaveBeenNthCalledWith(1, rawPlaylist);
    expect(mockedToPlayable).toHaveBeenNthCalledWith(1, subRawPlayable1);
    expect(mockedToPlayable).toHaveBeenNthCalledWith(2, subRawPlayable2);
  });

  it("calls the toPlayable method even if the raw-playable content is deeply nested within the nested raw-playlist", async () => {
    const mockedToPlaylist = jest
      .spyOn(converter, "toPlaylist")
      .mockImplementation();
    const mockedToPlayable = jest
      .spyOn(converter, "toPlayble")
      .mockImplementation();
    jest.spyOn(converter, "createAssociation").mockImplementation();

    const subRawPlayable = createSubRawPlayable();
    const nestedRawPlaylist = createRawPlaylist({ entries: [subRawPlayable] });
    const rawPlaylist = createRawPlaylist({ entries: [nestedRawPlaylist] });

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    expect(mockedToPlaylist).toHaveBeenCalledTimes(2);
    expect(mockedToPlayable).toHaveBeenCalledTimes(1);
  });

  it("calls the createAssociation method after converted the raw-playlist that with raw-playables to a playlist and playables", async () => {
    const playlist = new Playlist();
    const playable = new Playable();

    jest.spyOn(converter, "toPlaylist").mockResolvedValue(playlist);
    jest.spyOn(converter, "toPlayble").mockResolvedValue(playable);
    const mockedCreateAssociation = jest
      .spyOn(converter, "createAssociation")
      .mockImplementation();

    const subRawPlayable = createSubRawPlayable();
    const rawPlaylist = createRawPlaylist({
      entries: [subRawPlayable],
      requested_entries: [20],
    });

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    expect(mockedCreateAssociation).toHaveBeenCalledWith(
      playlist,
      [playable],
      [20],
    );
  });
});
