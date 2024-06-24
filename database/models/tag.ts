import { Optional } from "sequelize";
import {
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
import Playlist from "./playlist";
import Taggable from "./taggable";

interface OptionalTagCreationAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TagAttributes extends OptionalTagCreationAttributes {
  name: string;
}

export interface TagCreationAttributes
  extends Optional<TagAttributes, keyof OptionalTagCreationAttributes> {}

@Table({ underscored: true })
export default class Tag extends Model<TagAttributes, TagCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Column
  name: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Medium, {
    through: { model: () => Taggable, scope: { taggableType: "medium" } },
    foreignKey: "tagId",
  })
  media: Medium[];

  @BelongsToMany(() => Playlist, {
    through: { model: () => Taggable, scope: { taggableType: "playlist" } },
    foreignKey: "tagId",
  })
  playlists: Playlist[];
}
