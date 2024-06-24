import sequelize from "@/database/connection";
import Medium from "@/database/models/medium";
import Playlist from "@/database/models/playlist";
import RawInfoConverter from "@/src/raw-info-converter";
import {
  createRawPlaylist,
  createSubRawMedium,
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

  it("calls the toMedium method when providing a raw-playlist that contains raw-media", async () => {
    const mockedToPlaylist = jest
      .spyOn(converter, "toPlaylist")
      .mockImplementation();
    const mockedToMedium = jest
      .spyOn(converter, "toPlayble")
      .mockImplementation();
    jest.spyOn(converter, "createAssociation").mockImplementation();

    const subRawMedium1 = createSubRawMedium();
    const subRawMedium2 = createSubRawMedium();
    const rawPlaylist = createRawPlaylist({
      entries: [subRawMedium1, subRawMedium2],
    });

    sequelize.options.logging = console.log;

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    sequelize.options.logging = undefined;
    expect(mockedToPlaylist).toHaveBeenCalledTimes(1);
    expect(mockedToMedium).toHaveBeenCalledTimes(2);
    expect(mockedToPlaylist).toHaveBeenNthCalledWith(1, rawPlaylist);
    expect(mockedToMedium).toHaveBeenNthCalledWith(1, subRawMedium1);
    expect(mockedToMedium).toHaveBeenNthCalledWith(2, subRawMedium2);
  });

  it("calls the toMedium method even if the raw-medium content is deeply nested within the nested raw-playlist", async () => {
    const mockedToPlaylist = jest
      .spyOn(converter, "toPlaylist")
      .mockImplementation();
    const mockedToMedium = jest
      .spyOn(converter, "toPlayble")
      .mockImplementation();
    jest.spyOn(converter, "createAssociation").mockImplementation();

    const subRawMedium = createSubRawMedium();
    const nestedRawPlaylist = createRawPlaylist({ entries: [subRawMedium] });
    const rawPlaylist = createRawPlaylist({ entries: [nestedRawPlaylist] });

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    expect(mockedToPlaylist).toHaveBeenCalledTimes(2);
    expect(mockedToMedium).toHaveBeenCalledTimes(1);
  });

  it("calls the createAssociation method after converted the raw-playlist that with raw-media to a playlist and media", async () => {
    const playlist = new Playlist();
    const medium = new Medium();

    jest.spyOn(converter, "toPlaylist").mockResolvedValue(playlist);
    jest.spyOn(converter, "toPlayble").mockResolvedValue(medium);
    const mockedCreateAssociation = jest
      .spyOn(converter, "createAssociation")
      .mockImplementation();

    const subRawMedium = createSubRawMedium();
    const rawPlaylist = createRawPlaylist({
      entries: [subRawMedium],
      requested_entries: [20],
    });

    await converter.fromRawPlaylistAndEntries(rawPlaylist);

    expect(mockedCreateAssociation).toHaveBeenCalledWith(
      playlist,
      [medium],
      [20],
    );
  });
});
