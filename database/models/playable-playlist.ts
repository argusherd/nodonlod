import { Column, ForeignKey, Model, Table } from "sequelize-typescript";
import Playable from "./playable";
import Playlist from "./playlist";

@Table({ underscored: true, timestamps: false, tableName: "playable_playlist" })
export default class PlayablePlaylist extends Model {
  @ForeignKey(() => Playable)
  @Column
  playableId: string;

  @ForeignKey(() => Playlist)
  @Column
  playlistId: string;
}
