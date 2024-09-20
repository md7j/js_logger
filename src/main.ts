import Logger from "./logger"
import ConsoleHandler from "./handlers/console"
import GraylogTLSHandler from "./handlers/graylog-tls"
import { readFileSync } from "fs"
import { join } from "path"

const certificates_dir = join(__dirname, "../certificates/data/")

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const logger = new Logger("MKTV")
logger.addHandler(new ConsoleHandler())
logger.addHandler(new GraylogTLSHandler({
  host: '45.133.178.124',
  port: 12201,
  key: readFileSync(join(certificates_dir, "client.key")),
  cert: readFileSync(join(certificates_dir, "client.crt")),
  ca: readFileSync(join(certificates_dir, "ca.crt")),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.2',
  // ciphers: "AES128-GCM-SHA256",
  // honorCipherOrder: true,
}))

console.log(readFileSync(join(certificates_dir, "client.key")))

logger.info("test")
// logger.info("test2")
// logger.info("test3")
// logger.info(Object.keys(logger.handlers)[0])
