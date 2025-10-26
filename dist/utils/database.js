"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseInfo = getDatabaseInfo;
function getDatabaseInfo() {
    const dbUrl = process.env.DATABASE_URL || "";
    try {
        const urlPattern = /^(\w+):\/\/[^@]+@([^:/]+):?(\d+)?\/([^?]+)/;
        const match = dbUrl.match(urlPattern);
        if (match) {
            const [, provider, host, port, database] = match;
            const defaultPorts = {
                mysql: "3306",
                postgresql: "5432",
                postgres: "5432",
            };
            return {
                provider: provider.toLowerCase(),
                database: database,
                host: host,
                port: port || defaultPorts[provider] || "unknown",
            };
        }
    }
    catch (error) {
        console.error("Error parsing DATABASE_URL:", error);
    }
    return {
        provider: "Unknown",
        database: "Not configured",
        host: "localhost",
        port: "unknown",
    };
}
