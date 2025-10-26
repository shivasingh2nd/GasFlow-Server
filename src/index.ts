import express, { Application } from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { APP_NAME, APP_VERSION } from "./config/constants";
import { prisma } from "./config/prisma";
import { getDatabaseInfo } from "./utils/database";
import { logger } from "./utils/logger";
import { ResponseHandler } from "./utils/response";
import { errorHandler, notFoundHandler } from "./middleware";

// Import string extensions
import "./utils/stringExtensions";

// Import routes (we'll create these)
// import routes from './routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
  ResponseHandler.success(
    res,
    {
      app: APP_NAME,
      version: APP_VERSION,
      status: "running",
    },
    `${APP_NAME} API is running`
  );
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbInfo = getDatabaseInfo();

    ResponseHandler.success(res, {
      status: "healthy",
      database: {
        connected: true,
        provider: dbInfo.provider,
        name: dbInfo.database,
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    ResponseHandler.error(res, "Database connection failed", 503);
  }
});

// API Routes
// app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(ENV.PORT, () => {
  const dbInfo = getDatabaseInfo();

  logger.success(`${APP_NAME} Server Started`);
  logger.info(`Server: http://localhost:${ENV.PORT}`);
  logger.info(`Database: ${dbInfo.provider} (${dbInfo.database})`);
  logger.info(`Environment: ${ENV.NODE_ENV}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info("HTTP server closed");
    await prisma.$disconnect();
    logger.success("Database disconnected");
    logger.success("Graceful shutdown completed");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
  if (ENV.NODE_ENV === "production") {
    shutdown("UNHANDLED_REJECTION");
  }
});
