import RawInfoConverter from "@/src/raw-info-converter";
import {
  createRawPlayable,
  createRawPlaylist,
} from "../../setup/create-raw-info";

describe("The convertAll method in the RawInfoConverter", () => {
  let converter: RawInfoConverter;

  beforeEach(() => {
    converter = new RawInfoConverter();
  });

  it("calls the fromRawPlaylistAndEntries method when providing a raw-playlist", async () => {
    const mockedFromRawPlaylistAndEntries = jest
      .spyOn(converter, "fromRawPlaylistAndEntries")
      .mockImplementation();
    const rawPlaylist = createRawPlaylist();

    await converter.convertAll(rawPlaylist);

    expect(mockedFromRawPlaylistAndEntries).toHaveBeenCalledWith(rawPlaylist);
  });

  it("calls the toPlayble method when providing a raw-playable", async () => {
    const mockedToPlable = jest
      .spyOn(converter, "toPlayble")
      .mockImplementation();
    const rawPlayable = createRawPlayable();

    await converter.convertAll(rawPlayable);

    expect(mockedToPlable).toHaveBeenCalledWith(rawPlayable);
  });
});
