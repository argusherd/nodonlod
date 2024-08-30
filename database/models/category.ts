import { Optional } from "sequelize";
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import Label from "./label";

interface OptionalCategoryCreationAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryAttributes extends OptionalCategoryCreationAttributes {
  name: string;
  type: "string" | "number" | "datetime";
}

export interface CategoryCreationAttributes
  extends Optional<
    CategoryAttributes,
    keyof OptionalCategoryCreationAttributes
  > {}

@Table({ underscored: true })
export default class Category extends Model<
  CategoryAttributes,
  CategoryCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Unique
  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column
  type: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Label)
  labels: Label[];
}
