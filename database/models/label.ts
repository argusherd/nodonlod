import { Op, Optional } from "sequelize";
import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Scopes,
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
  text: string;
}

export interface LabelCreationAttributes
  extends Optional<LabelAttributes, keyof OptionalLabelCreationAttributes> {}

@Scopes(() => ({
  search(value: string) {
    return value
      ? {
          where: {
            [Op.or]: [
              { category: { [Op.substring]: value } },
              { text: { [Op.substring]: value } },
            ],
          },
        }
      : {};
  },
}))
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
  text: string;

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
