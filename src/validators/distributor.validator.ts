import { z } from "zod";

// Create distributor validation
export const createDistributorSchema = z.object({
  distributorName: z
    .string()
    .min(2, "Distributor name must be at least 2 characters")
    .max(255, "Distributor name is too long"),
  contactNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Contact number must be 10 digits"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address is too long"),
});

// Update distributor validation
export const updateDistributorSchema = z
  .object({
    distributorName: z
      .string()
      .min(2, "Distributor name must be at least 2 characters")
      .max(255, "Distributor name is too long")
      .optional(),
    contactNumber: z
      .string()
      .regex(/^[0-9]{10}$/, "Contact number must be 10 digits")
      .optional(),
    address: z
      .string()
      .min(5, "Address must be at least 5 characters")
      .max(500, "Address is too long")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Export types
export type CreateDistributorInput = z.infer<typeof createDistributorSchema>;
export type UpdateDistributorInput = z.infer<typeof updateDistributorSchema>;
