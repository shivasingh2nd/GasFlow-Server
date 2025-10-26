import jwt, { Secret } from "jsonwebtoken";
import { ENV } from "../config/env";
import { User } from "@prisma/client";

interface AdminJWTPayload {
  role: "ADMIN";
  email: string;
}

interface UserJWTPayload {
  userId: number;
  email: string;
  role: "USER";
}

type JWTPayload = AdminJWTPayload | UserJWTPayload;

export class JWTUtil {
  // Generate admin token (no userId, just role)
  static generateAdminToken(): string {
    const payload: AdminJWTPayload = {
      role: "ADMIN",
      email: ENV.ADMIN_EMAIL,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    });
  }

  // Generate user token (has userId)
  static generateUserToken(user: User): string {
    const payload: UserJWTPayload = {
      userId: user.id,
      email: user.email,
      role: "USER",
    };

    return jwt.sign(payload, ENV.JWT_SECRET as Secret, {});
  }

  // Verify token
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  // Check if token is admin
  static isAdminToken(payload: JWTPayload): payload is AdminJWTPayload {
    return payload.role === "ADMIN";
  }

  // Check if token is user
  static isUserToken(payload: JWTPayload): payload is UserJWTPayload {
    return payload.role === "USER";
  }
}
