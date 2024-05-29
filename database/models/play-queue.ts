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
import Playable from "./playable";

interface OptionalPlayQueueCreationAttributes {
  id: number;
  chapterId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayQueueAttributes extends OptionalPlayQueueCreationAttributes {
  playableId: string;
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

  @ForeignKey(() => Playable)
  @Column
  playableId: string;

  @ForeignKey(() => Chapter)
  @Column
  chapterId: string;

  @Column
  order: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Playable)
  playable: Playable;

  @BelongsTo(() => Chapter)
  chapter: Chapter;
}
