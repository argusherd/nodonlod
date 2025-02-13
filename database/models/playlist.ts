import { Optional } from "sequelize";
import {
  AllowNull,
  BeforeDestroy,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import Label from "./label";
import Labelable from "./labelable";
import Medium from "./medium";
import PlaylistItem from "./playlist-item";

interface OptionalPlaylistCreationAttributes {
  id: string;
  url: string;
  resourceId: string;
  domain: string;
  thumbnail: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistAttributes extends OptionalPlaylistCreationAttributes {
  title: string;
}

export interface PlaylistCreationAttributes
  extends Optional<
    PlaylistAttributes,
    keyof OptionalPlaylistCreationAttributes
  > {}

@Table({ underscored: true })
export default class Playlist extends Model<
  PlaylistAttributes,
  PlaylistCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @AllowNull(false)
  @Column
  title: string;

  @Unique
  @Column
  url: string;

  @Column
  resourceId: string;

  @Column
  domain: string;

  @Column
  thumbnail: string;

  @Column
  description: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Medium, () => PlaylistItem)
  media: Array<Medium & { PlaylistItem: PlaylistItem }>;

  @BelongsToMany(() => Label, {
    through: { model: () => Labelable, scope: { labelableType: "playlist" } },
    foreignKey: "labelableId",
  })
  labels: Label[];

  @BeforeDestroy
  static async removeBelongsToMany(instance: Playlist) {
    await Labelable.destroy({
      where: { labelableId: instance.id, labelableType: "playlist" },
    });
  }
}
