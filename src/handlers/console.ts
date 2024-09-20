import { Handler, LoggerConfig, Message, MessageExtra } from "../../types/types"
import { MessageLevel } from "../logger"

const loggerFunctionByLevel: { [key in MessageLevel]: (message: any, ...args: any[]) => void } = {
  [MessageLevel.Debug]: console.debug,
  [MessageLevel.Info]: console.info,
  [MessageLevel.Warning]: console.warn,
  [MessageLevel.Error]: console.error,
  [MessageLevel.Critical]: console.error
}

const levelNameByLevel: { [key in MessageLevel]: string } = {
  [MessageLevel.Critical]: "Critical",
  [MessageLevel.Error]: "Error",
  [MessageLevel.Warning]: "Warning",
  [MessageLevel.Info]: "Info",
  [MessageLevel.Debug]: "Debug",
};

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export type logFormatter = (message: Message, level: MessageLevel, extra: MessageExtra, date: Date) => string

export interface ConsoleHandlerConfig {
  formatter: logFormatter
  level: MessageLevel
}

export default class ConsoleHandler implements Handler {
  config: ConsoleHandlerConfig

  constructor(config?: Partial<ConsoleHandlerConfig>) {
    this.config = {
      formatter: (message, level, _, date) => `${getDateString(date)} - ${levelNameByLevel[level]} - ${message}`,
      level: MessageLevel.Debug,
      ...config
    }
  }

  message(_: LoggerConfig, message: Message, level: MessageLevel, extra?: MessageExtra): void {
    if (!(level in loggerFunctionByLevel))
      throw new Error(`Invalid log level: ${level}`)

    if (!extra)
      extra = {}

    const formatted_string = this.config.formatter(message, level, extra, new Date())
    loggerFunctionByLevel[level](formatted_string)
  }
}
