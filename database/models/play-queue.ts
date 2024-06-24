import { Optional } from "sequelize";
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import Chapter from "./chapter";
import Medium from "./medium";

interface OptionalPlayQueueCreationAttributes {
  id: number;
  chapterId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayQueueAttributes extends OptionalPlayQueueCreationAttributes {
  mediumId: string;
}

interface PlayQueueCreationAttributes
  extends Optional<
    PlayQueueAttributes,
    keyof OptionalPlayQueueCreationAttributes
  > {}

@Table({ underscored: true })
export default class PlayQueue extends Model<
  PlayQueueAttributes,
  PlayQueueCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Medium)
  @Column
  mediumId: string;

  @ForeignKey(() => Chapter)
  @Column
  chapterId: string;

  @Column
  order: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Medium)
  medium: Medium;

  @BelongsTo(() => Chapter)
  chapter?: Chapter;
}
