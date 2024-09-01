import {
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Medium from "./medium";
import Performer from "./performer";

@Table({ underscored: true })
export default class Performable extends Model {
  @ForeignKey(() => Performer)
  @Column
  performerId: string;

  @ForeignKey(() => Medium)
  @Column
  performableId: string;

  @Column
  performableType: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
