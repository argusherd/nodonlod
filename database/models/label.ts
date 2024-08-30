import { Optional } from "sequelize";
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
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
import Labelable from "./labelable";
import Medium from "./medium";
import Playlist from "./playlist";

interface OptionalLabelCreationAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LabelAttributes extends OptionalLabelCreationAttributes {
  categoryId: string;
  text: string;
}

export interface LabelCreationAttributes
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

  @BelongsToMany(() => Medium, {
    through: { model: () => Labelable, scope: { labelableType: "medium" } },
    foreignKey: "labelId",
  })
  media: Medium[];

  @BelongsToMany(() => Playlist, {
    through: { model: () => Labelable, scope: { labelableType: "playlist" } },
    foreignKey: "labelId",
  })
  playlists: Playlist[];
}
