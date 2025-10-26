import { z } from "zod";

// Create staff validation
export const createStaffSchema = z.object({
  staffName: z
    .string()
    .min(2, "Staff name must be at least 2 characters")
    .max(255, "Staff name is too long"),
  mobileNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
});

// Update staff validation
export const updateStaffSchema = z
  .object({
    staffName: z
      .string()
      .min(2, "Staff name must be at least 2 characters")
      .max(255, "Staff name is too long")
      .optional(),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Export types
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
