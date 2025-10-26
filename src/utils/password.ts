import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class PasswordUtil {
  // Hash password
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Compare password with hash
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Validate password strength
  static validate(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain lowercase letter",
      };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain number" };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain special character (!@#$%^&*)",
      };
    }
    return { valid: true };
  }
}
