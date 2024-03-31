import { Optional } from "sequelize";
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { RawPlayable, RawPlaylist } from "../../src/raw-info-extractor";

interface OptionalExtractionCreationAttributes {
  id: number;
  resourceId: string;
  content: string | null;
  error: string | null;
  isProcessing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ExtractionAttributes extends OptionalExtractionCreationAttributes {
  url: string;
}

interface ExtractionCreationAttributes
  extends Optional<
    ExtractionAttributes,
    keyof OptionalExtractionCreationAttributes
  > {}

@Table({ underscored: true })
export default class Extraction extends Model<
  ExtractionAttributes,
  ExtractionCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  url: string;

  @Column
  resourceId: string;

  @Column
  get content(): RawPlayable | RawPlaylist | null {
    if (!this.getDataValue("content")) return null;

    const rawInfo: RawPlayable | RawPlaylist = JSON.parse(
      this.getDataValue("content") as string,
    );

    if (rawInfo._type === "video") return rawInfo;

    if (rawInfo.entries[0]?._type === "video") return rawInfo;

    rawInfo.entries = mergeRawPlayables(rawInfo);

    return rawInfo;
  }

  set content(value: string) {
    this.setDataValue("content", value);
  }

  @Column
  error: string;

  @Default(false)
  @Column
  isProcessing: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

function mergeRawPlayables(
  rawPlaylist: RawPlaylist,
  mergedRawPlayables: RawPlayable[] = [],
): RawPlayable[] {
  if (rawPlaylist.entries[0]?._type === "video") {
    (rawPlaylist.entries as RawPlayable[]).forEach((rawPlayable) =>
      mergedRawPlayables.push(rawPlayable),
    );
  } else if (rawPlaylist.entries[0]?._type === "playlist") {
    (rawPlaylist.entries as RawPlaylist[]).forEach((rawPlaylist) =>
      mergeRawPlayables(rawPlaylist, mergedRawPlayables),
    );
  }

  return mergedRawPlayables;
}
