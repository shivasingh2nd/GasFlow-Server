import { z } from "zod";

// Sales item schema
const salesItemSchema = z.object({
  cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
  quantitySold: z.number().positive("Quantity sold must be greater than 0"),
  sellingPricePerCylinder: z
    .number()
    .positive("Selling price must be greater than 0"),
});

// Empty received schema
const emptyReceivedSchema = z.object({
  cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
  quantityReceived: z
    .number()
    .positive("Quantity received must be greater than 0"),
});

// Customer loan schema
const customerLoanSchema = z.object({
  customerId: z.number().positive("Invalid customer ID"),
  cylinderTypeId: z.number().positive("Invalid cylinder type ID"),
  quantityLoaned: z.number().positive("Quantity loaned must be greater than 0"),
});

// Create daily sales validation
export const createDailySalesSchema = z.object({
  staffId: z.number().positive("Invalid staff ID"),
  salesDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  items: z.array(salesItemSchema).min(1, "At least one sales item is required"),
  emptiesReceived: z.array(emptyReceivedSchema).optional().default([]),
  customerLoans: z.array(customerLoanSchema).optional().default([]),
});

// Create customer validation
export const createCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .max(255, "Customer name is too long"),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address is too long"),
});

// Update customer validation
export const updateCustomerSchema = z
  .object({
    customerName: z
      .string()
      .min(2, "Customer name must be at least 2 characters")
      .max(255, "Customer name is too long")
      .optional(),
    phoneNumber: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
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

// Query filters validation
export const salesFiltersSchema = z.object({
  staffId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Export types
export type CreateDailySalesInput = z.infer<typeof createDailySalesSchema>;
export type SalesItemInput = z.infer<typeof salesItemSchema>;
export type EmptyReceivedInput = z.infer<typeof emptyReceivedSchema>;
export type CustomerLoanInput = z.infer<typeof customerLoanSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type SalesFiltersInput = z.infer<typeof salesFiltersSchema>;
