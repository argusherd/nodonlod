import { Optional } from "sequelize";
import {
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
import Chapter from "./chapter";
import Medium from "./medium";
import Playlist from "./playlist";

interface OptionalPlaylistableCreationAttributes {
  id: string;
  chapterId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistableAttributes
  extends OptionalPlaylistableCreationAttributes {
  playlistId: string;
  mediumId: string;
}

export interface PlaylistableCreationAttributes
  extends Optional<
    PlaylistableAttributes,
    keyof OptionalPlaylistableCreationAttributes
  > {}

@Table({ underscored: true })
export default class Playlistable extends Model<
  PlaylistableAttributes,
  PlaylistableCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @ForeignKey(() => Playlist)
  @Column
  playlistId: string;

  @ForeignKey(() => Medium)
  @Column
  mediumId: string;

  @ForeignKey(() => Chapter)
  @Column
  chapterId: string;

  @Column
  order: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Playlist)
  playlist: Playlist;

  @BelongsTo(() => Medium)
  medium: Medium;

  @BelongsTo(() => Chapter)
  chapter: Chapter | null;
}
