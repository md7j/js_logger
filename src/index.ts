import Logger from "./logger";
import ConsoleHandler from "./handlers/console";
import GraylogTLSHandler from "./handlers/graylog-tls";

export default Logger;
export { ConsoleHandler, GraylogTLSHandler };
