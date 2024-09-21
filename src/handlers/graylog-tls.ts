import { connect, ConnectionOptions } from "tls";
import { hostname } from "os";
import {
  Handler,
  Message,
  MessageExtra,
  LoggerConfig,
} from "../../types/types";
import { MessageLevel } from "../logger";

export interface GraylogTLSHandlerConfig extends ConnectionOptions {
  hostname: string;
  timeout: number;
}

interface GELFPayload {
  version?: string;
  host?: string;
  timestamp?: number;
  level: number;
  short_message: string;
  full_message?: string;

  [key: `_${string}`]: string;
}

export default class GraylogTLSHandler implements Handler {
  config: GraylogTLSHandlerConfig;

  constructor(config?: Partial<GraylogTLSHandlerConfig>) {
    this.config = {
      hostname: hostname(),
      host: "127.0.0.1",
      port: 12201,
      timeout: 1000,
      ...config,
    };
  }

  _anyToString(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";

    switch (typeof value) {
      case "string":
        return value;
      case "object":
        if (value instanceof Date) return value.toISOString();
        else return JSON.stringify(value);
      case "function":
        return value.toString();
      default:
        return String(value);
    }
  }

  async _send(data: string) {
    return new Promise<void>((resolve, reject) => {
      const client = connect(this.config);

      client.setTimeout(this.config.timeout, () => {
        client.emit(
          "error",
          new Error("Timeout (" + this.config.timeout + " ms)"),
        );
      });

      client.once("connect", () => {
        client.write(data + "\n", "utf8", () => {
          client.end();
        });
      });

      client.on("error", (err) => {
        client.end();
        client.destroy();
        reject(err.message.toString());
      });

      client.on("end", () => {});
    });
  }

  async message(
    logger_config: LoggerConfig,
    message: Message,
    level: MessageLevel,
    extra?: MessageExtra,
  ): Promise<void> {
    const payload: GELFPayload = {
      version: "1.1",
      host: this.config.hostname,
      timestamp: new Date().getTime() / 1000,
      level: level,
      short_message: "",

      _logger_version: logger_config.logger_version,
      _operation_id: logger_config.operation_id,
      _project_name: logger_config.project_name,
    };

    if (!extra) extra = {};

    if (message instanceof Error) {
      payload.short_message = message.message.toString() || "Error";
      payload.full_message = message.stack;
    } else {
      payload.short_message = message;
    }

    if ("id" in extra) {
      console.warn(
        "Removing extra field 'id' (https://go2docs.graylog.org/current/getting_in_log_data/gelf.html)",
      );
      delete extra.id;
    }

    const fieldNamePattern = /^[\w\.\-]*$/;
    for (const key in extra) {
      if (!fieldNamePattern.test(key))
        throw new Error(
          `Extra field '${key}' has an invalid format (must satisfy ${fieldNamePattern} regular expression)`,
        );
      payload[`_${key}`] = this._anyToString(extra[key]);
    }

    return this._send(JSON.stringify(payload));
  }
}
