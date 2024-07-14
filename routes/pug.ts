import dayjs from "dayjs";
import { join } from "path";
import { renderFile } from "pug";
import neatDuration from "../src/neat-duration";
import { i18n } from "./middlewares/i18n";

dayjs.extend(neatDuration);

const relativePath =
  process.env.NODE_ENV === "test" ? "../views" : "../../views";

const render = (filename: string, params?: object) =>
  renderFile(join(__dirname, relativePath, filename), {
    ...params,
    dayjs,
    __: i18n.__,
  });

export default render;
