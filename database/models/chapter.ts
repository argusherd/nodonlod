import { Optional } from "sequelize";
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
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
import Medium from "./medium";
import Playlist from "./playlist";
import Playlistable from "./playlistable";

interface OptionalChapterCreationAttributes {
  id: string;
  mediumId: string;
  startTime: number;
  endTime: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChapterAttributes extends OptionalChapterCreationAttributes {
  title: string;
}

export interface ChapterCreationAttributes
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

  @ForeignKey(() => Medium)
  @Column
  mediumId: string;

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

  @BelongsTo(() => Medium)
  medium: Medium;

  @BelongsToMany(() => Playlist, () => Playlistable)
  playlists: Array<Playlist & { Playlistable: Playlistable }>;
}
