import dayjs from "dayjs";
import { FindAndCountOptions, Op, Optional } from "sequelize";
import {
  AllowNull,
  BeforeDestroy,
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
  Scopes,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import { sortable } from "../scopes";
import Chapter from "./chapter";
import Label from "./label";
import Labelable from "./labelable";
import Performable from "./performable";
import Performer from "./performer";
import Playlist from "./playlist";
import Playlistable from "./playlistable";
import Uploader from "./uploader";

interface OptionalMediumCreationAttributes {
  id: string;
  uploaderId: string;
  description: string;
  thumbnail: string | null;
  rating: number | null;
  ageLimit: number;
  playCount: number;
  uploadDate: Date;
  hasError: string | null;
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

@Scopes(() => ({
  ...sortable(Medium.supportedSort),
  search: (value) => ({
    where: {
      ...(value && {
        [Op.or]: [
          { title: { [Op.substring]: value } },
          { description: { [Op.substring]: value } },
        ],
      }),
    },
  }),
  withPerformers: () => ({
    include: { model: Performer, order: [["name", "asc"]] },
  }),
}))
@Table({ underscored: true })
export default class Medium extends Model<
  MediumAttributes,
  MediumCreationAttributes
> {
  static readonly supportedSort = [
    "createdAt",
    "duration",
    "playCount",
    "rating",
    "title",
  ];

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

  @Column
  rating: number;

  @Default(0)
  @Column
  ageLimit: number;

  @Default(0)
  @Column
  playCount: number;

  @IsDate
  @Column(DataType.DATE)
  get uploadDate(): Date | null {
    if (!this.getDataValue("uploadDate")) return null;

    return dayjs(this.getDataValue("uploadDate")).toDate();
  }

  @Column
  hasError: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => Playlist, () => Playlistable)
  playlists: Array<Playlist & { Playlistable: Playlistable }>;

  @BelongsTo(() => Uploader)
  uploader: Uploader;

  @HasMany(() => Chapter)
  chapters: Chapter[];

  @BelongsToMany(() => Label, {
    through: { model: () => Labelable, scope: { labelableType: "medium" } },
    foreignKey: "labelableId",
  })
  labels: Label[];

  @BelongsToMany(() => Performer, {
    through: { model: () => Performable, scope: { performableType: "medium" } },
    foreignKey: "performableId",
  })
  performers: Performer[];

  @BeforeDestroy
  static async removeBelongsToMany(instance: Medium) {
    await Labelable.destroy({
      where: { labelableId: instance.id, labelableType: "medium" },
    });

    await Performable.destroy({
      where: { performableId: instance.id, performableType: "medium" },
    });
  }
}

const originalMethod = Medium.findAndCountAll;

Medium.findAndCountAll = function (options?: FindAndCountOptions) {
  if (options && options.distinct && !options.col)
    options.col = `${this.name}.${this.primaryKeyAttribute}`;

  return originalMethod.call(this, options);
};
