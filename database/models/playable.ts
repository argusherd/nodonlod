import dayjs from "dayjs";
import { Optional } from "sequelize";
import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  IsDate,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import PlayablePlaylist from "./playable-playlist";
import Playlist from "./playlist";

interface OptionalPlayableCreationAttributes {
  id: string;
  description: string;
  thumbnail: string | null;
  ageLimit: number;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayableAttributes extends OptionalPlayableCreationAttributes {
  url: string;
  resourceId: string;
  domain: string;
  title: string;
  duration: number;
}

export interface PlayableCreationAttributes
  extends Optional<
    PlayableAttributes,
    keyof OptionalPlayableCreationAttributes
  > {}

@Table({ underscored: true })
export default class Playable extends Model<
  PlayableAttributes,
  PlayableCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @AllowNull(false)
  @Unique
  @Column
  url: string;

  @AllowNull(false)
  @Unique
  @Column
  resourceId: string;

  @AllowNull(false)
  @Column
  domain: string;

  @AllowNull(false)
  @Column
  title: string;

  @AllowNull(false)
  @Column
  duration: number;

  @Column
  description: string;

  @Column
  thumbnail: string;

  @Default(0)
  @Column
  ageLimit: number;

  @IsDate
  @Column
  get uploadDate(): Date {
    return dayjs(this.getDataValue("uploadDate")).toDate();
  }

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Playlist, () => PlayablePlaylist)
  playlists: Playlist[];
}
