import dayjs from "dayjs";
import { join } from "path";
import { renderFile } from "pug";
import neatDuration from "../src/neat-duration";
import { __ } from "./middlewares/i18n";

dayjs.extend(neatDuration);

const relativePath =
  process.env.NODE_ENV === "test" ? "../views" : "../../views";

const render = (filename: string, params?: object) =>
  renderFile(join(__dirname, relativePath, filename), {
    ...params,
    dayjs,
    __,
  });

export default render;
