import { Optional } from "sequelize";
import {
  AllowNull,
  BeforeDestroy,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
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
import Playlistable from "./playlistable";

interface OptionalPlaylistCreationAttributes {
  id: string;
  url: string;
  resourceId: string;
  domain: string;
  thumbnail: string;
  description: string;
  rating: number | null;
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

  @Column
  rating: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Medium, () => Playlistable)
  media: Array<Medium & { Playlistable: Playlistable }>;

  @HasMany(() => Playlistable)
  playlistables: Playlistable[];

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

  async reorderPlaylistables() {
    const playlistables = await this.$get("playlistables", {
      order: [
        ["order", "ASC NULLS LAST"],
        ["updatedAt", "DESC"],
      ],
    });

    let order = 1;

    const rows =
      playlistables?.map(({ id, playlistId, mediumId }) => ({
        id,
        playlistId,
        mediumId,
        order: order++,
      })) || [];

    await Playlistable.bulkCreate(rows, {
      conflictAttributes: ["id"],
      updateOnDuplicate: ["order"],
    });
  }
}
