import { z } from "zod";

// Payment method enum
export const PaymentMethodEnum = z.enum([
  "Cash",
  "UPI",
  "Card",
  "Cheque",
  "BankTransfer",
  "Other",
]);

// Create payment validation
export const createPaymentSchema = z.object({
  distributorId: z.number().positive("Invalid distributor ID"),
  amountPaid: z.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  paymentMethod: PaymentMethodEnum,
  transactionReference: z
    .string()
    .max(255, "Transaction reference is too long")
    .optional(),
});

// Update payment validation
export const updatePaymentSchema = z
  .object({
    amountPaid: z.number().positive("Amount must be greater than 0").optional(),
    paymentDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
      })
      .optional(),
    paymentMethod: PaymentMethodEnum.optional(),
    transactionReference: z
      .string()
      .max(255, "Transaction reference is too long")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Query filters validation
export const paymentFiltersSchema = z.object({
  distributorId: z.string().optional(),
  paymentMethod: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Export types
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
