import { Optional } from "sequelize";
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Category from "./category";

interface OptionalLabelCreationAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LabelAttributes extends OptionalLabelCreationAttributes {
  categoryId: string;
  text: string;
}

interface LabelCreationAttributes
  extends Optional<LabelAttributes, keyof OptionalLabelCreationAttributes> {}

@Table({ underscored: true })
export default class Label extends Model<
  LabelAttributes,
  LabelCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @ForeignKey(() => Category)
  @Column
  categoryId: string;

  @AllowNull(false)
  @Column
  text: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Category)
  category: Category;
}
