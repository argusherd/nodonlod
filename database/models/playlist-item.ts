import { Optional } from "sequelize";
import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Chapter from "./chapter";
import Playable from "./playable";
import Playlist from "./playlist";

interface OptionalPlaylistItemCreationAttributes {
  chapterId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistItemAttributes
  extends OptionalPlaylistItemCreationAttributes {
  playlistId: string;
  playableId: string;
}

interface PlaylistItemCreationAttributes
  extends Optional<
    PlaylistItemAttributes,
    keyof OptionalPlaylistItemCreationAttributes
  > {}

@Table({ underscored: true })
export default class PlaylistItem extends Model<
  PlaylistItemAttributes,
  PlaylistItemCreationAttributes
> {
  @ForeignKey(() => Playlist)
  @Column
  playlistId: string;

  @ForeignKey(() => Playable)
  @Column
  playableId: string;

  @ForeignKey(() => Chapter)
  @Column
  chapterId: string;

  @Column
  order: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Chapter)
  chapter: Chapter;
}
