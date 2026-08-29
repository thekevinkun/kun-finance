// Import libraries
import { db } from "../lib/db";
import { hashPassword, comparePassword } from "../lib/bcrypt";
import { signToken, generateRefreshToken, hashToken } from "../lib/jwt";

// Import types
import { Result } from "@kun-finance/shared";
import { RegisterInput, LoginInput, AuthResult } from "../types/auth";

// Register user
export const registerUser = async (
  data: RegisterInput,
): Promise<Result<AuthResult>> => {
  try {
    // Check if an account with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        ok: false,
        error: "An account with this email already exists.",
      };
    }

    // Hash the password before saving — NEVER store plain text passwords
    const hashedPassword = await hashPassword(data.password);

    // Create the new user in the database
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
      },
    });

    // Remove passwordHash before returning to user
    const { passwordHash: _, ...safeUser } = user;

    // Generate the 15-minute access token
    const accessToken = signToken({
      userId: user.id,
    });

    // Generate the 30-day refresh token
    const refreshToken = generateRefreshToken();

    // Store the HASH of the refresh token in the database — never the raw token
    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return {
      ok: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    console.error("registerUser error:", error);
    return {
      ok: false,
      error: "Failed to create your account. Please try again.",
    };
  }
};

export const loginUser = async (
  data: LoginInput,
): Promise<Result<AuthResult>> => {
  try {
    // Look up the user by email
    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    // If user doesn't exist, return a vague error
    // Saying "user not found" would tell attackers which emails are registered
    if (!user) {
      return {
        ok: false,
        error:
          "The email or password you entered is incorrect. Please try again.",
      };
    }

    // Compare the submitted password against the stored hash
    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash,
    );

    // Wrong password
    if (!isPasswordValid) {
      return {
        ok: false,
        error:
          "The email or password you entered is incorrect. Please try again.",
      };
    }

    // Remove passwordHash before returning the user
    const { passwordHash: _, ...safeUser } = user;

    // Generate the 15-minute access token
    // We will set this in memory, frontend
    const accessToken = signToken({
      userId: user.id,
    });

    // Generate the 30-day refresh token (random bytes, not a JWT)
    // We'll set this cookie in secure httpOnly on route
    const refreshToken = generateRefreshToken();

    // Store the HASH of the refresh token in the database — never the raw token
    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return { ok: true, data: { user: safeUser, accessToken, refreshToken } };
  } catch (error) {
    console.error("loginUser error:", error);

    return { ok: false, error: "Failed to log you in. Please try again." };
  }
};

export const refreshToken = async (
  refreshToken: string,
): Promise<Result<{ accessToken: string; newRefreshToken: string }>> => {
  try {
    // Hash the incoming refresh token so we can look it up in the database
    const hashedRefreshToken = hashToken(refreshToken);

    // Find the token record in our database
    const storedToken = await db.refreshToken.findUnique({
      where: { tokenHash: hashedRefreshToken },
    });

    // Check the failure cases before issuing new tokens //
    // If the token is not exist, reject
    if (!storedToken) {
      return {
        ok: false,
        error: "Invalid or expired refresh token. Please log in again.",
      };
    }

    // If the token is expired, reject
    if (storedToken.expiresAt < new Date()) {
      return {
        ok: false,
        error: "Invalid or expired refresh token. Please log in again.",
      };
    }

    // If the token is revoked,
    // we want to revoke ALL of that user's other active refresh tokens
    // to prevent suspicious reuse of a dead token from attacker
    if (storedToken.revokedAt) {
      // Possible refresh-token reuse
      await db.refreshToken.updateMany({
        where: {
          userId: storedToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return {
        ok: false,
        error: "Invalid or expired refresh token. Please log in again.",
      };
    }

    // Start to issuing new tokens //
    // Generate brand new the 15-minute access token
    const accessToken = signToken({
      userId: storedToken.userId,
    });

    // Generate the 30-day refresh token
    const newRefreshToken = generateRefreshToken();

    // Create the new token, then update the old one to revoke it
    // Remind: If the server crashes between those two calls,
    // you get a new valid token issued AND the old one still active — two valid sessions for one refresh.
    // Wrap them in a Prisma transaction. Both succeed or both fail — no partial state.
    await db.$transaction([
      db.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      db.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      ok: true,
      data: {
        accessToken,
        newRefreshToken,
      },
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    return {
      ok: false,
      error: "Failed to refresh new token. Please try again.",
    };
  }
};
