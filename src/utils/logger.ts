import { ENV } from "../config/env";

type LogLevel = "info" | "warn" | "error" | "debug" | "success";

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  info(message: string, meta?: any): void {
    console.log(`📝 ${this.formatMessage("info", message, meta)}`);
  }

  success(message: string, meta?: any): void {
    console.log(`✅ ${this.formatMessage("success", message, meta)}`);
  }

  warn(message: string, meta?: any): void {
    console.warn(`⚠️  ${this.formatMessage("warn", message, meta)}`);
  }

  error(message: string, meta?: any): void {
    console.error(`❌ ${this.formatMessage("error", message, meta)}`);
  }

  debug(message: string, meta?: any): void {
    if (ENV.NODE_ENV === "development") {
      console.debug(`🐛 ${this.formatMessage("debug", message, meta)}`);
    }
  }
}

export const logger = new Logger();
