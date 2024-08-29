import dayjs from "dayjs";
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
  HasMany,
  IsDate,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import Chapter from "./chapter";
import Label from "./label";
import Labelable from "./labelable";
import Playlist from "./playlist";
import PlaylistItem from "./playlist-item";
import Tag from "./tag";
import Taggable from "./taggable";
import Uploader from "./uploader";

interface OptionalMediumCreationAttributes {
  id: string;
  uploaderId: string;
  description: string;
  thumbnail: string | null;
  ageLimit: number;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MediumAttributes extends OptionalMediumCreationAttributes {
  url: string;
  resourceId: string;
  domain: string;
  title: string;
  duration: number;
}

export interface MediumCreationAttributes
  extends Optional<MediumAttributes, keyof OptionalMediumCreationAttributes> {}

@Table({ underscored: true })
export default class Medium extends Model<
  MediumAttributes,
  MediumCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @ForeignKey(() => Uploader)
  @Column
  uploaderId: string;

  @AllowNull(false)
  @Unique
  @Column
  url: string;

  @AllowNull(false)
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
  @Column(DataType.DATE)
  get uploadDate(): Date | null {
    if (!this.getDataValue("uploadDate")) return null;

    return dayjs(this.getDataValue("uploadDate")).toDate();
  }

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Playlist, () => PlaylistItem)
  playlists: Array<Playlist & { PlaylistItem: PlaylistItem }>;

  @BelongsTo(() => Uploader)
  uploader: Uploader;

  @HasMany(() => Chapter)
  chapters: Chapter[];

  @BelongsToMany(() => Tag, {
    through: { model: () => Taggable, scope: { taggableType: "medium" } },
    foreignKey: "taggableId",
  })
  tags: Tag[];

  @BelongsToMany(() => Label, {
    through: { model: () => Labelable, scope: { labelableType: "medium" } },
    foreignKey: "labelableId",
  })
  labels: Label[];
}
