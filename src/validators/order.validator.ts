import { z } from "zod";

// Order item schema
const orderItemSchema = z.object({
  cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  pricePerCylinder: z.number().positive("Price must be greater than 0"),
});

// Cylinder return schema
const cylinderReturnSchema = z.object({
  cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
  quantity: z.number().positive("Quantity must be greater than 0"),
});

// Create order validation
export const createOrderSchema = z.object({
  distributorId: z.number().positive("Invalid distributor ID"),
  orderDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  deliveryPerson: z
    .string()
    .min(2, "Delivery person name must be at least 2 characters")
    .max(255, "Delivery person name is too long"),
  items: z.array(orderItemSchema).min(1, "At least one order item is required"),
  returns: z.array(cylinderReturnSchema).optional().default([]),
});

// Query filters validation
export const orderFiltersSchema = z.object({
  distributorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Export types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CylinderReturnInput = z.infer<typeof cylinderReturnSchema>;
