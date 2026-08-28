// Global error-handling middleware — catches errors from any route/service
// and returns a consistent, user-safe JSON shape. Must be registered LAST in index.ts,
// after all routes, so Express routes errors here.
import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Log full error server-side for debugging — never send stack traces to the client
  console.error(err);

  res.status(500).json({
    ok: false,
    error: "Something went wrong. Please try again.",
  });
}
