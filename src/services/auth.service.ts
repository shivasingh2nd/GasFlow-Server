import { prisma } from "../config/prisma";
import { ENV } from "../config/env";
import { PasswordUtil } from "../utils/password";
import { JWTUtil } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler.middleware";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants";

export class AuthService {
  // Admin login (hardcoded credentials from .env)
  static async adminLogin(email: string, password: string) {
    if (email !== ENV.ADMIN_EMAIL || password !== ENV.ADMIN_PASSWORD) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Create admin token (not from database)
    const token = JWTUtil.generateAdminToken();

    return {
      user: {
        email: ENV.ADMIN_EMAIL,
        role: "ADMIN",
        name: "Admin",
      },
      token,
    };
  }

  // User login (from database - all are retailers)
  static async userLogin(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", HTTP_STATUS.FORBIDDEN);
    }

    const isPasswordValid = await PasswordUtil.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = JWTUtil.generateUserToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: "USER",
      },
      token,
    };
  }

  // Register new user (admin only)
  static async registerUser(data: {
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
  }) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { mobileNumber: data.mobileNumber }],
      },
    });

    if (existingUser) {
      throw new AppError(
        existingUser.email === data.email
          ? "Email already exists"
          : "Mobile number already exists",
        HTTP_STATUS.CONFLICT
      );
    }

    // Validate password
    const passwordValidation = PasswordUtil.validate(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message!, HTTP_STATUS.BAD_REQUEST);
    }

    // Hash password
    const passwordHash = await PasswordUtil.hash(data.password);

    // Create user (all are retailers by default)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  // Reset user password (admin only)
  static async resetUserPassword(userId: number, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Validate password
    const passwordValidation = PasswordUtil.validate(newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message!, HTTP_STATUS.BAD_REQUEST);
    }

    const passwordHash = await PasswordUtil.hash(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Password reset successfully" };
  }

  // Get all users (admin only)
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users;
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (!user.isActive) {
      throw new AppError(
        "User is already deactivated",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: "User deactivated successfully" };
  }

  // Activate user (admin only)
  static async activateUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.isActive) {
      throw new AppError("User is already active", HTTP_STATUS.BAD_REQUEST);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return { message: "User activated successfully" };
  }

  // Get user by ID (admin only or self)
  static async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }
}
