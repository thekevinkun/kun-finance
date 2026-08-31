import crypto from "crypto";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

// Load the JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Ensure the JWT secret is set, otherwise throw an error
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// Define the structure of the token payload, which includes the standard JWT payload and a userId
export type TokenPayload = JwtPayload & {
  userId: string;
};

// Sign (create) a JWT token (Access Token)
export const signToken = (payload: object, options?: SignOptions): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m", // Token dies in 15 minutes — limits damage if stolen
    ...options,
  });
};

// Verify a JWT token (check signature and verification)
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    // Return null if the token is invalid or expired
    return null;
  }
};

// Decode a JWT token WITHOUT verifying the signature (use with caution)
export const decodeToken = (token: string): null | JwtPayload | string => {
  return jwt.decode(token);
};

// REFRESH TOKEN
// Generate a long-lived refresh token (30 days)
// This is NOT a JWT — it's just a random string we store in the database
// Storing it in DB means we can revoke it anytime (JWT can't be revoked)
export const generateRefreshToken = (): string => {
  // randomBytes(64) creates 64 random bytes → toString('hex') makes it a 128-char string
  // Practically impossible to guess — much safer than a predictable ID
  return crypto.randomBytes(64).toString("hex");
};

// HASH TOKEN
// Hash a token before storing it in the database
// Same idea as hashing passwords — if DB leaks, attackers get useless hashes
export const hashToken = (token: string): string => {
  // SHA-256 is a one-way hash — you can't reverse-engineer the original from the hash
  return crypto.createHash("sha256").update(token).digest("hex");
};
