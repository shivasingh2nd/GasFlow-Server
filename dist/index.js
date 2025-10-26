"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const constants_1 = require("./config/constants");
const prisma_1 = require("./config/prisma");
const database_1 = require("./utils/database");
const logger_1 = require("./utils/logger");
const response_1 = require("./utils/response");
const middleware_1 = require("./middleware");
// Import string extensions
require("./utils/stringExtensions");
// Import routes (we'll create these)
// import routes from './routes';
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check route
app.get("/", (req, res) => {
    response_1.ResponseHandler.success(res, {
        app: constants_1.APP_NAME,
        version: constants_1.APP_VERSION,
        status: "running",
    }, `${constants_1.APP_NAME} API is running`);
});
app.get("/health", async (req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        const dbInfo = (0, database_1.getDatabaseInfo)();
        response_1.ResponseHandler.success(res, {
            status: "healthy",
            database: {
                connected: true,
                provider: dbInfo.provider,
                name: dbInfo.database,
            },
            uptime: process.uptime(),
        });
    }
    catch (error) {
        response_1.ResponseHandler.error(res, "Database connection failed", 503);
    }
});
// API Routes
// app.use('/api', routes);
// Error handling
app.use(middleware_1.notFoundHandler);
app.use(middleware_1.errorHandler);
// Start server
const server = app.listen(env_1.ENV.PORT, () => {
    const dbInfo = (0, database_1.getDatabaseInfo)();
    logger_1.logger.success(`${constants_1.APP_NAME} Server Started`);
    logger_1.logger.info(`Server: http://localhost:${env_1.ENV.PORT}`);
    logger_1.logger.info(`Database: ${dbInfo.provider} (${dbInfo.database})`);
    logger_1.logger.info(`Environment: ${env_1.ENV.NODE_ENV}`);
});
// Graceful shutdown
const shutdown = async (signal) => {
    logger_1.logger.warn(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        logger_1.logger.info("HTTP server closed");
        await prisma_1.prisma.$disconnect();
        logger_1.logger.success("Database disconnected");
        logger_1.logger.success("Graceful shutdown completed");
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
    logger_1.logger.error("Unhandled Rejection:", reason);
    if (env_1.ENV.NODE_ENV === "production") {
        shutdown("UNHANDLED_REJECTION");
    }
});
