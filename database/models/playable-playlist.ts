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

interface OptionalPlayablePlaylistCreationAttributes {
  chapterId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayablePlaylistAttributes
  extends OptionalPlayablePlaylistCreationAttributes {
  playableId: string;
  playlistId: string;
}

interface PlayablePlaylistCreationAttributes
  extends Optional<
    PlayablePlaylistAttributes,
    keyof OptionalPlayablePlaylistCreationAttributes
  > {}

@Table({ underscored: true, tableName: "playable_playlist" })
export default class PlayablePlaylist extends Model<
  PlayablePlaylistAttributes,
  PlayablePlaylistCreationAttributes
> {
  @ForeignKey(() => Playable)
  @Column
  playableId: string;

  @ForeignKey(() => Playlist)
  @Column
  playlistId: string;

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
