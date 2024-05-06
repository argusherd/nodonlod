import { Optional } from "sequelize";
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Playable from "./playable";

interface OptionalChapterCreationAttributes {
  id: string;
  playableId: string;
  startTime: number;
  endTime: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChapterAttributes extends OptionalChapterCreationAttributes {
  title: string;
}

interface ChapterCreationAttributes
  extends Optional<
    ChapterAttributes,
    keyof OptionalChapterCreationAttributes
  > {}

@Table({ underscored: true })
export default class Chapter extends Model<
  ChapterAttributes,
  ChapterCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @ForeignKey(() => Playable)
  @Column
  playableId: string;

  @AllowNull(false)
  @Column
  title: string;

  @Column
  startTime: number;

  @Column
  endTime: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Playable)
  playable: Playable;
}
