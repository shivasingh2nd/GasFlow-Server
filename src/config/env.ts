import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3001", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  JWT_EXPIRES_IN: parseInt(process.env.JWT_EXPIRES_IN || "86400", 10),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@gasflow.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
} as const;

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
] as const;

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export const isDevelopment = ENV.NODE_ENV === "development";
export const isProduction = ENV.NODE_ENV === "production";
export const isTest = ENV.NODE_ENV === "test";
