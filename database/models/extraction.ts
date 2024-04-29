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
  isContinuous: boolean;
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
  resourceId: string;

  @Column
  get content(): RawPlayable | RawPlaylist | null {
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

  @Default(1)
  @Column
  page: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
