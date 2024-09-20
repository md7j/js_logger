import { randomUUID } from "crypto"
import { LoggerConfig, Message, MessageExtra, Handler } from "../types/types"

const LOGGER_VERSION = "1"

export enum MessageLevel {
  Critical = 2,
  Error = 3,
  Warning = 4,
  Info = 6,
  Debug = 7,
}

export default class Logger {
  config: LoggerConfig;
  handlers: { [key: string]: Handler }

  constructor(project_name: string) {
    this.config = {
      project_name: project_name,
      operation_id: randomUUID(),
      logger_version: LOGGER_VERSION
    }
    this.handlers = {}
  }

  addHandler(handler: Handler, label?: string): void {
    this.handlers[label || `${handler.constructor.name}_${randomUUID()}`] = handler
  }

  removeHandler(label: string) {
    delete this.handlers[label]
  }

  async _log(message: Message, level: MessageLevel, extra?: MessageExtra): Promise<void> {
    if (!Object.keys(this.handlers).length)
      console.warn(`No handlers configured for logger: ${this.config.project_name}`)

    const statuses = (await Promise.allSettled(
      Object.values(this.handlers).map(async (handler: Handler) => await handler.message(this.config, message, level, extra))
    ))
      .filter((status) => status.status === "rejected")
      .map((status, index) => {
        return { ...status, handler: Object.keys(this.handlers)[index] }
      })

    const errors = statuses
      .filter(status => status)

    if (errors.length)
      throw new AggregateError([errors.map((error) => {
        return `[${error.handler}] ${error.reason}`
      })], "One or more handlers failed")
  }

  async debug(message: Message, extra?: MessageExtra) { return this._log(message, MessageLevel.Debug, extra) }
  async info(message: Message, extra?: MessageExtra) { return this._log(message, MessageLevel.Info, extra) }
  async warning(message: Message, extra?: MessageExtra) { return this._log(message, MessageLevel.Warning, extra) }
  async error(message: Message, extra?: MessageExtra) { return this._log(message, MessageLevel.Error, extra) }
  async critical(message: Message, extra?: MessageExtra) { return this._log(message, MessageLevel.Critical, extra) }
}

