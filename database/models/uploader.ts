import { Optional } from "sequelize";
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from "sequelize-typescript";
import Playable from "./playable";

interface OptionalUploaderCreationAttributes {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UploaderAttributes extends OptionalUploaderCreationAttributes {
  url: string;
  name: string;
}

export interface UploaderCreationAttributes
  extends Optional<
    UploaderAttributes,
    keyof OptionalUploaderCreationAttributes
  > {}

@Table({ underscored: true })
export default class Uploader extends Model<
  UploaderAttributes,
  UploaderCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @AllowNull(false)
  @Unique
  @Column
  url: string;

  @AllowNull(false)
  @Column
  name: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Playable)
  playables: Playable[];
}
