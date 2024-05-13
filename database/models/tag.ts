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
import Playable from "./playable";
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

interface TagCreationAttributes
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

  @BelongsToMany(() => Playable, {
    through: { model: () => Taggable, scope: { taggableType: "playable" } },
    foreignKey: "tagId",
  })
  playables: Playable[];

  @BelongsToMany(() => Playlist, {
    through: { model: () => Taggable, scope: { taggableType: "playlist" } },
    foreignKey: "tagId",
  })
  playlists: Playlist[];
}
