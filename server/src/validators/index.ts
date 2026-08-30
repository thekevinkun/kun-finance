// ZOD Validation Middleware
// A reusable helper that validates req.body against a Zod schema
// If validation fails, it returns 400 with the exact error message
// If validation passes, it replaces req.body with the parsed (cleaned) data

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod/v3";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate the incoming body against the Zod schema
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: result.error.errors, // validate middleware returns an object instead of sending a response
      });
    }

    // Overwrite req.body with the sanitized, validated Zod data
    req.body = result.data;

    // Validation passed — proceed to the controller
    next();
  };
};
