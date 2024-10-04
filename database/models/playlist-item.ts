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

interface OptionalPlaylistItemCreationAttributes {
  id: string;
  chapterId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistItemAttributes
  extends OptionalPlaylistItemCreationAttributes {
  playlistId: string;
  mediumId: string;
}

export interface PlaylistItemCreationAttributes
  extends Optional<
    PlaylistItemAttributes,
    keyof OptionalPlaylistItemCreationAttributes
  > {}

@Table({ underscored: true })
export default class PlaylistItem extends Model<
  PlaylistItemAttributes,
  PlaylistItemCreationAttributes
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
