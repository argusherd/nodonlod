import { Optional } from "sequelize";
import {
  AllowNull,
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

  @Unique
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
}
