import {
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Playable from "./playable";
import Playlist from "./playlist";

@Table({ underscored: true, tableName: "playable_playlist" })
export default class PlayablePlaylist extends Model {
  @ForeignKey(() => Playable)
  @Column
  playableId: string;

  @ForeignKey(() => Playlist)
  @Column
  playlistId: string;

  @Column
  order: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
