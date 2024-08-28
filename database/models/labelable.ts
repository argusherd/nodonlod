import {
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Label from "./label";
import Medium from "./medium";
import Playlist from "./playlist";

@Table({ underscored: true })
export default class Labelable extends Model {
  @ForeignKey(() => Label)
  @Column
  labelId: string;

  @ForeignKey(() => Medium)
  @ForeignKey(() => Playlist)
  @Column
  labelableId: string;

  @Column
  labelableType: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
