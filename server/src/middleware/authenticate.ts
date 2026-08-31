// The middleware function that protects routes
// Checks for a valid JWT in the request cookies and verifies it.
// If the token is valid, the user is authenticated and can access the protected route.
// If not, an error response is sent back to the client.

import { verifyToken } from "../lib/jwt";
import type { TokenPayload } from "../lib/jwt";
import type { Request, Response, NextFunction } from "express";

// Extend Express's Request type so we can attach the decoded user to req.user
// This lets any route handler downstream access req.user without TypeScript complaining
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Get the Authorization header from the request
  const authHeader = req.headers.authorization;

  // If the Authorization header is missing or doesn't start with "Bearer ", reject the request
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "No authentication token provided. Please log in to access.",
    });
  }

  // Extract the access token from the Authorization header
  const accessToken = authHeader.split(" ")[1];

  // If there's no token, user not logged in. Reject immediately
  if (!accessToken) {
    return res.status(401).json({
      ok: false,
      error: "No authentication token provided. Please log in to access.",
    });
  }

  // If there's a token, verify it
  // verifyJwt checks two things: the signature is valid AND the token hasn't expired
  // If either check fails, it throws null from verifyToken in /lib/jwt
  const decoded = verifyToken(accessToken);

  // jwt.verify() threw — token is either expired, tampered with, or malformed
  if (!decoded) {
    return res.status(401).json({
      ok: false,
      error: "Invalid or expired token. Please log in again.",
    });
  }

  // Attach the decoded user data to the request object
  // Every route handler after this middleware can now access req.user
  req.user = decoded;

  // Token is valid — pass control to the next middleware or route handler
  next();
};
