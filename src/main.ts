import Logger from "./logger";
import ConsoleHandler from "./handlers/console";
import GraylogTLSHandler from "./handlers/graylog-tls";
import { readFileSync } from "fs";
import { join } from "path";

const certificates_dir = join(
  __dirname,
  process.env.CERTIFICATES_DIR || "./certificates",
);

const host = join(__dirname, process.env.HOST || "127.0.0.1");
const port = Number(join(__dirname, process.env.PORT || "12201"));

const logger = new Logger("MKTV");
logger.addHandler(new ConsoleHandler());
logger.addHandler(
  new GraylogTLSHandler({
    host: host,
    port: port,
    ca: readFileSync(join(certificates_dir, "ca.crt")),
    cert: readFileSync(join(certificates_dir, "client.crt")),
    key: readFileSync(join(certificates_dir, "client.key")),
    rejectUnauthorized: true,
  }),
);

logger.info("[TEST] Sample message.");
