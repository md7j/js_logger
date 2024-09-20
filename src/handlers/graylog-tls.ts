import { connect, ConnectionOptions } from 'tls'
import { hostname } from "os"
import { Handler, Message, MessageExtra, LoggerConfig } from "../../types/types"
import { MessageLevel } from "../logger"

export interface GraylogTLSHandlerConfig extends ConnectionOptions {
  // host: string
  // port: number
  hostname: string
  timeout: number
  // connect_options: ConnectionOptions
}

interface GELFPayload {
  version?: string;      // GELF version (e.g., "1.1")
  host?: string;         // Hostname or IP address of the machine sending the log
  timestamp?: number;    // Unix timestamp (seconds since epoch)
  level: number;         // Log level (e.g., 1 = Emergency, 2 = Alert, etc.)
  short_message: string; // Short message describing the log event
  full_message?: string; // Full message (optional, more detailed than short_message)

  [key: `_${string}`]: string;
}

export default class GraylogTLSHandler implements Handler {
  config: GraylogTLSHandlerConfig

  constructor(config?: Partial<GraylogTLSHandlerConfig>) {
    this.config = {
      hostname: hostname(),
      host: "127.0.0.1",
      port: 12201,
      timeout: 1000,
      ...config
    }
  }

  _anyToString(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    switch (typeof value) {
      case 'string':
        return value;
      case 'object':
        if (value instanceof Date)
          return value.toISOString()
        else
          return JSON.stringify(value)
      case 'function':
        return value.toString();
      default:
        return String(value);
    }
  }

  async _send(data: string) {
    const client = connect({
      ...this.config
    }, () => {
      // console.log(this.config)
      // console.log('Client connected:', client.authorized ? 'authorized' : 'unauthorized');
      // if (client.authorized) {
      //   console.log('Connected to server');
      // } else {
      //   console.log('Server verification failed:', client.authorizationError);
      // }
    });

    return new Promise<void>((resolve, reject) => {
      client
        .setEncoding('utf8')
        .setTimeout(this.config.timeout, () => {
          client.emit('error', new Error('Timeout (' + this.config.timeout + ' ms)'));
        })
        .once('error', (err: Error) => {
          client.end();
          client.destroy();
          reject(err.message.toString())
        })
        .once('connect', function () {
          const msg = Buffer.from(data.replace(/\x00/g, ''))
          const packet = Buffer.from(Array.prototype.slice.call(msg, 0, msg.length).concat(0x00))

          client.end(packet, function () {
            console.log("SUCCESS")
          });
        });
    })
  }

  async message(logger_config: LoggerConfig, message: Message, level: MessageLevel, extra?: MessageExtra): Promise<void> {
    const payload: GELFPayload = {
      version: '1.1',
      host: this.config.hostname,
      timestamp: new Date().getTime() / 1000,
      level: level,
      short_message: "",

      _logger_version: logger_config.logger_version,
      _operation_id: logger_config.operation_id,
      _project_name: logger_config.project_name
    };

    if (!extra)
      extra = {}

    if (message instanceof Error) {
      payload.short_message = message.message.toString() || 'Error'
      payload.full_message = message.stack
    }

    if ("id" in extra) {
      console.warn("Removing extra field 'id' (https://go2docs.graylog.org/current/getting_in_log_data/gelf.html)")
      delete extra.id
    }

    const fieldNamePattern = /^[\w\.\-]*$/;
    for (const key in extra) {
      if (!fieldNamePattern.test(key))
        throw new Error(`Extra field '${key}' has an invalid format (must satisfy ${fieldNamePattern} regular expression)`)
      payload[`_${key}`] = this._anyToString(extra[key])
    }

    return this._send(JSON.stringify(payload))
  }
}



// var logger = Object.create(null, {
//   config: {
//     enumerable: true,
//     writable: true,
//     value: {
//       hostname: hostname(),
//       project_name: "markentive_project",
//       operation_id: randomUUID(),
//       host: '127.0.0.1',
//       port: 12201
//     }
//   }
// })
//
// logger.setConfig = function (config) {
//   this.config = { ...this.config, ...config }
//   return this;
// };
//
// logger.send = function (message, level, extra, callback) {
//   callback = callback || ((...args) => undefined)
//
//   if (!message) return callback(null, 0);
//
//   // If extra is not an object or undefined if (extra !== undefined && !(typeof extra === 'object' && !Array.isArray(extra) && extra !== null))
//   extra = {}
//
//   const payload = {
//     version: '1.1',
//     host: this.config.hostname,
//     timestamp: new Date().getTime() / 1000,
//     level: level,
//     short_message: message,
//     full_message: undefined,
//
//     _logger_version: VERSION,
//     _operation_id: this.config.operation_id,
//     _project_name: this.config.project_name
//   };
//
//   return payload;
// }
//
//
// function cachedFunc(func) {
//   var cache = "__magic__"
//   return (...args) => {
//     if (cache !== "__magic__") return cache
//     cache = func(...args)
//     return cache
//   }
// }
//
// /**
//  * Sends a message to the server
//  * @param {String} message
//  * @param {Function} callback
//  * @returns {adapter}
//  */
// adapter.send = function (message, callback) {
//   const timeout = this.options.timeout || 10000
//   const client = connect(this.options);
//
//   callback = cachedFunc(callback || ((...args) => undefined))
//
//   client.setTimeout(timeout, function () {
//     client.emit('error', new Error('Timeout (' + timeout + ' ms)'));
//   });
//
//   client
//     .once('error', function (err) {
//       client.end();
//       client.destroy();
//       callback(err);
//     })
//     .once('connect', function () {
//       const msg = buffer.from(message.replace(/\x00/g, ''))
//       const packet = buffer.from(Array.prototype.slice.call(msg, 0, msg.length).concat(0x00))
//
//       client.end(packet, function () {
//         callback(null, packet.length);
//       });
//     });
//
//   return this;
// };
//
// export default adapter
