// Catches requests to routes that don't exist.
// Registered after all real routes, before errorHandler.
import type { Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    ok: false,
    error: "Route not found.",
  });
}
