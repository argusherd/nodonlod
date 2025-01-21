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
import Labelable from "./labelable";
import Medium from "./medium";
import Playlist from "./playlist";

interface OptionalLabelCreationAttributes {
  id: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LabelAttributes extends OptionalLabelCreationAttributes {
  content: string;
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

  @Column
  category: string;

  @AllowNull(false)
  @Column
  content: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

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
