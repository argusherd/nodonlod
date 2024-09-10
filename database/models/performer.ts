import { Optional } from "sequelize";
import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Medium from "./medium";
import Performable from "./performable";

interface OptionalPerformerCreationAttributes {
  id: string;
  description: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformerAttributes extends OptionalPerformerCreationAttributes {
  name: string;
}

export interface PerformerCreationAttributes
  extends Optional<
    PerformerAttributes,
    keyof OptionalPerformerCreationAttributes
  > {}

@Table({ underscored: true })
export default class Performer extends Model<
  PerformerAttributes,
  PerformerCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @AllowNull(false)
  @Column
  name: string;

  @Column
  description: string;

  @Column
  thumbnail: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Medium, {
    through: { model: () => Performable, scope: { performableType: "medium" } },
    foreignKey: "performerId",
  })
  media: Medium[];
}