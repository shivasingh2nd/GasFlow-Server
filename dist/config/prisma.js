"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Create singleton instance
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
};
exports.prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = exports.prisma;
}
// Graceful shutdown handler
const disconnectPrisma = async () => {
    await exports.prisma.$disconnect();
    console.log("📊 Database disconnected");
};
exports.disconnectPrisma = disconnectPrisma;
