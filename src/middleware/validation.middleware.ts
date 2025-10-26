import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ResponseHandler } from "../utils/response";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.reduce((acc, err) => {
          acc[err.path.join(".")] = err.message;
          return acc;
        }, {} as Record<string, string>);

        return ResponseHandler.badRequest(res, "Validation failed", errors);
      }
      next(error);
    }
  };
};
