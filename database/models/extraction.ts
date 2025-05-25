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
import { RawMedium, RawPlaylist } from "../../src/raw-info-extractor";

interface OptionalExtractionCreationAttributes {
  id: number;
  content: string | null;
  error: string | null;
  isProcessing: boolean;
  isContinuous: boolean;
  isConvertible: boolean;
  shouldPreserveChapters: boolean;
  shouldPreserveTags: boolean;
  page: number;
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
  get content(): RawMedium | RawPlaylist | null {
    if (!this.getDataValue("content")) return null;

    return JSON.parse(this.getDataValue("content") as string);
  }

  set content(value: string) {
    this.setDataValue("content", value);
  }

  @Column
  error: string;

  @Default(false)
  @Column
  isProcessing: boolean;

  @Default(false)
  @Column
  isContinuous: boolean;

  @Default(true)
  @Column
  isConvertible: boolean;

  @Default(false)
  @Column
  shouldPreserveChapters: boolean;

  @Default(false)
  @Column
  shouldPreserveTags: boolean;

  @Default(1)
  @Column
  page: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
