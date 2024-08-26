import { Optional } from "sequelize";
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";

interface OptionalCategoryCreationAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryAttributes extends OptionalCategoryCreationAttributes {
  name: string;
  type: string;
}

interface CategoryCreationAttributes
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
}
