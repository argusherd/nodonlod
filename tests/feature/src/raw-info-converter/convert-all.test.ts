import RawInfoConverter from "@/src/raw-info-converter";
import {
  createRawMedium,
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

  it("calls the toMedium method when providing a raw-medium", async () => {
    const mockedToPlable = jest
      .spyOn(converter, "toMedium")
      .mockImplementation();
    const rawMedium = createRawMedium();

    await converter.convertAll(rawMedium);

    expect(mockedToPlable).toHaveBeenCalledWith(rawMedium);
  });
});
