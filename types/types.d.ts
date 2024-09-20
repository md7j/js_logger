export interface LoggerConfig {
  project_name: string
  operation_id: string
  logger_version: string
}

export type Message = string | Error;
export type MessageExtra = { [key: string]: any };

export interface Handler {
  message: (logger_config: LoggerConfig, message: Message, level: number, extra?: MessageExtra) => Promise<void> | void
}

