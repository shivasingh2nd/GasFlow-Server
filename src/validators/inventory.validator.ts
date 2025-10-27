import { z } from "zod";

// Opening stock item schema
const openingStockItemSchema = z
  .object({
    cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
    fullCylinders: z.number().int().min(0, "Full cylinders cannot be negative"),
    emptyCylinders: z
      .number()
      .int()
      .min(0, "Empty cylinders cannot be negative"),
  })
  .refine((data) => data.fullCylinders > 0 || data.emptyCylinders > 0, {
    message: "At least one cylinder (full or empty) must be greater than 0",
  });

// Opening stock validation
export const openingStockSchema = z.object({
  items: z
    .array(openingStockItemSchema)
    .min(1, "At least one inventory item is required"),
  openingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

// Inventory adjustment validation
export const inventoryAdjustmentSchema = z
  .object({
    cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
    fullCylinderChange: z.number().int(),
    emptyCylinderChange: z.number().int(),
    reason: z
      .string()
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason is too long"),
    adjustmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  })
  .refine(
    (data) => data.fullCylinderChange !== 0 || data.emptyCylinderChange !== 0,
    { message: "At least one change (full or empty) must be non-zero" }
  );

// Query filters validation
export const inventoryFiltersSchema = z.object({
  cylinderTypeId: z.string().optional(),
  company: z.string().optional(),
  lowStock: z.string().optional(),
  threshold: z.string().optional(),
});

// Export types
export type OpeningStockInput = z.infer<typeof openingStockSchema>;
export type OpeningStockItemInput = z.infer<typeof openingStockItemSchema>;
export type InventoryAdjustmentInput = z.infer<
  typeof inventoryAdjustmentSchema
>;
export type InventoryFiltersInput = z.infer<typeof inventoryFiltersSchema>;
