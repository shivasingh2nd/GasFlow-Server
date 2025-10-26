import { z } from "zod";

// Admin login validation
export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// User login validation
export const userLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Register user validation (by admin)
export const registerUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name too long"),
  email: z.string().email("Invalid email format"),
  mobileNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[0-9]/, "Password must contain number")
    .regex(/[!@#$%^&*]/, "Password must contain special character"),
});

// Reset password validation (by admin)
export const resetPasswordSchema = z.object({
  userId: z.number().positive("Invalid user ID"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[0-9]/, "Password must contain number")
    .regex(/[!@#$%^&*]/, "Password must contain special character"),
});

// Export types
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
