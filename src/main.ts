import Logger from "./logger";
import ConsoleHandler from "./handlers/console";
import GraylogTLSHandler from "./handlers/graylog-tls";
import { readFileSync } from "fs";
import { join } from "path";

const certificates_dir = join(__dirname, "../../certificates/client/");

const logger = new Logger("MKTV");
logger.addHandler(new ConsoleHandler());
logger.addHandler(
  new GraylogTLSHandler({
    host: "graylog-input.mbures.fr",
    port: 12201,
    ca: readFileSync(join(certificates_dir, "ca.crt")),
    cert: readFileSync(join(certificates_dir, "node-client.crt")),
    key: readFileSync(join(certificates_dir, "node-client.key")),
    rejectUnauthorized: true,
  }),
);

logger.info("test");
