// Import Express Router — this lets us define routes separately from the main server file
import { Router } from "express";
import { Request, Response } from "express";

// Import the service functions that handle the business logic for authentication
import {
  registerUser,
  loginUser,
  refreshToken,
} from "../../services/auth.service";

// Import ZOD Validation Middleware
import { validate } from "../../validators";

// Import our Zod schemas for validation
import { registerSchema, loginSchema } from "../../validators/auth.validator";

// ROUTES

// Create the router instance — we'll attach all auth routes to this
const router = Router();

// POST /api/auth/register
// Validate(registerSchema): checks email format, password strength, names are present
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response) => {
    // Call the registerUser service function with the validated request body
    const result = await registerUser(req.body);

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error: result.error,
      });
    }

    // Set the refresh token as an httpOnly cookie so it can't be accessed by JavaScript on the client side
    res.cookie("refresh_token", result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Return the user data and access token in the response body,
    // but never return the refresh token in the response body for security reasons
    return res.status(201).json({
      ok: true,
      data: { user: result.data.user, accessToken: result.data.accessToken },
    });
  },
);

// POST /api/auth/login
// Log in with email and password
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    // Call the loginUser service function with the validated request body
    const result = await loginUser(req.body);

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error: result.error,
      });
    }

    // Set the refresh token as an httpOnly cookie so it can't be accessed by JavaScript on the client side
    res.cookie("refresh_token", result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Return the user data and access token in the response body,
    // but never return the refresh token in the response body for security reasons
    return res.status(200).json({
      ok: true,
      data: { user: result.data.user, accessToken: result.data.accessToken },
    });
  },
);

// POST /api/auth/refresh
// Get a new access token using the refresh token cookie
// No Zod validation middleware here — the refresh token IS the credential for this route
router.post("/refresh", async (req: Request, res: Response) => {
  // Get the refresh token from the httpOnly cookie
  const getStoredRefreshToken = req.cookies?.refresh_token;

  if (!getStoredRefreshToken) {
    return res.status(400).json({
      ok: false,
      error: "Invalid refresh token",
    });
  }

  // Call the refreshToken service function with the stored refresh token
  const result = await refreshToken(getStoredRefreshToken);

  if (!result.ok) {
    return res.status(401).json({
      ok: false,
      error: result.error,
    });
  }

  // Set the new refresh token as an httpOnly cookie so it can't be accessed by JavaScript on the client side
  res.cookie("refresh_token", result.data.newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  // Return the new access token in the response body,
  // but never return the refresh token in the response body for security reasons
  return res.status(201).json({
    ok: true,
    data: { accessToken: result.data.accessToken },
  });
});

export default router;
