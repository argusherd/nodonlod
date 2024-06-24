import {
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Medium from "./medium";
import Playlist from "./playlist";
import Tag from "./tag";

@Table({ underscored: true })
export default class Taggable extends Model {
  @ForeignKey(() => Tag)
  @Column
  tagId: string;

  @ForeignKey(() => Medium)
  @ForeignKey(() => Playlist)
  @Column
  taggableId: string;

  @Column
  taggableType: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
