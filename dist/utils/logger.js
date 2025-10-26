"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const env_1 = require("../config/env");
class Logger {
    getTimestamp() {
        return new Date().toISOString();
    }
    formatMessage(level, message, meta) {
        const timestamp = this.getTimestamp();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
    }
    info(message, meta) {
        console.log(`📝 ${this.formatMessage("info", message, meta)}`);
    }
    success(message, meta) {
        console.log(`✅ ${this.formatMessage("success", message, meta)}`);
    }
    warn(message, meta) {
        console.warn(`⚠️  ${this.formatMessage("warn", message, meta)}`);
    }
    error(message, meta) {
        console.error(`❌ ${this.formatMessage("error", message, meta)}`);
    }
    debug(message, meta) {
        if (env_1.ENV.NODE_ENV === "development") {
            console.debug(`🐛 ${this.formatMessage("debug", message, meta)}`);
        }
    }
}
exports.logger = new Logger();
