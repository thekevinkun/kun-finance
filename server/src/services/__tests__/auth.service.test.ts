import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the three dependencies use in auth.service
vi.mock("../../lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock two functions in bcrypt
vi.mock("../../lib/bcrypt", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

// Mock three functions in jwt
vi.mock("../../lib/jwt", () => ({
  signToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashToken: vi.fn(),
}));

// Import the actual modules after mocking
import { db } from "../../lib/db";
import { hashPassword, comparePassword } from "../../lib/bcrypt";
import { registerUser, loginUser, refreshToken } from "../auth.service";
import { signToken, generateRefreshToken, hashToken } from "../../lib/jwt";

// Gives TypeScript/Vitest proper knowledge that these are mocks
const mockDb = vi.mocked(db, { deep: true });
const mockHashPassword = vi.mocked(hashPassword);
const mockComparePassword = vi.mocked(comparePassword);
const mockSignToken = vi.mocked(signToken);
const mockGenerateRefreshToken = vi.mocked(generateRefreshToken);
const mockHashToken = vi.mocked(hashToken);

// Reset mocks before every test
beforeEach(() => {
  vi.clearAllMocks();
});

// REGISTER USER CASES
describe("registerUser", () => {
  // Test 1 - Existing Email
  it("returns ok: false when email already exists", async () => {
    // Mock the database to return a user when searching for the email
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "paco@example.com",
      passwordHash: "hashed-password",
      name: "Paco",
      createdAt: new Date(),
      updateAt: new Date(),
    });

    // Call the registerUser function with an existing email
    const result = await registerUser({
      email: "paco@example.com",
      password: "password123",
      name: "Paco",
    });

    // Assert that the result indicates failure and contains the correct error message
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("An account with this email already exists.");
    }
  });

  // Test 2 — successful registration
  it("returns ok: true with user and tokens on success", async () => {
    // Mock the database to return null when searching for the email (indicating the email is available)
    mockDb.user.findUnique.mockResolvedValue(null);

    // Mock the hashPassword function to return a hashed password
    mockHashPassword.mockResolvedValue("hashed-password");

    // Mock the database to return a new user object when creating a user
    mockDb.user.create.mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      passwordHash: "hashed-password",
      name: "John",
      createdAt: new Date(),
      updateAt: new Date(),
    });

    // Mock the signToken, generateRefreshToken, and hashToken functions to return specific values
    mockSignToken.mockReturnValue("access-token");
    mockGenerateRefreshToken.mockReturnValue("refresh-token");
    mockHashToken.mockReturnValue("hashed-refresh-token");

    // Mock the database to return a new refresh token object when creating a refresh token
    mockDb.refreshToken.create.mockResolvedValue({
      id: "refresh-1",
      userId: "user-1",
      tokenHash: "hashed-refresh-token",
      expiresAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
    });

    // Call the registerUser function with valid user data
    const result = await registerUser({
      email: "john@example.com",
      password: "password123",
      name: "John",
    });

    // Assert that the result indicates success and contains the expected user and token data
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.accessToken).toBe("access-token");
      expect(result.data.refreshToken).toBe("refresh-token");
      expect(result.data.user.email).toBe("john@example.com");
    }
  });

  // Test 3 — passwordHash isn't returned
  it("does not return passwordHash", async () => {
    // Mock the database to return null when searching for the email (indicating the email is available)
    mockDb.user.findUnique.mockResolvedValue(null);

    // Mock the hashPassword function to return a hashed password
    mockHashPassword.mockResolvedValue("hashed-password");

    // Mock the database to return a new user object when creating a user
    mockDb.user.create.mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      passwordHash: "hashed-password",
      name: "John",
      createdAt: new Date(),
      updateAt: new Date(),
    });

    // Mock the signToken, generateRefreshToken, and hashToken functions to return specific values
    mockSignToken.mockReturnValue("access-token");
    mockGenerateRefreshToken.mockReturnValue("refresh-token");
    mockHashToken.mockReturnValue("hashed-refresh-token");

    // Mock the database to return a new refresh token object when creating a refresh token
    mockDb.refreshToken.create.mockResolvedValue({} as any);

    // Call the registerUser function with valid user data
    const result = await registerUser({
      email: "john@example.com",
      password: "password123",
      name: "John",
    });

    // Assert that the result indicates success and
    // that the passwordHash property is not present in the returned user object
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user).not.toHaveProperty("passwordHash");
    }
  });
});

// LOGIN USER CASES
describe("loginUser", () => {
  // Test 4 — user doesn't exist
  it("returns ok: false when user is not found", async () => {
    // Mock the database to return null when searching for the user by email (indicating the user does not exist)
    mockDb.user.findUnique.mockResolvedValue(null);

    // Call the loginUser function with an email that does not exist in the database
    const result = await loginUser({
      email: "john@example.com",
      password: "password123",
    });

    // Assert that the result indicates failure and contains the correct error message
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(
        "The email or password you entered is incorrect. Please try again.",
      );
    }
  });

  // Test 5 — wrong password
  it("returns ok: false when password is wrong", async () => {
    // Mock the database to return a user object when searching for the user by email (indicating the user exists)
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      passwordHash: "hashed-password",
      name: "John",
      createdAt: new Date(),
      updateAt: new Date(),
    });

    // Mock the comparePassword function to return false
    // (indicating the provided password does not match the stored password hash)
    mockComparePassword.mockResolvedValue(false);

    // Call the loginUser function with the correct email but an incorrect password
    const result = await loginUser({
      email: "john@example.com",
      password: "wrong-password",
    });

    // Assert that the result indicates failure and contains the correct error message
    expect(result.ok).toBe(false);

    // Assert that the error message is the same as for a missing user,
    // ensuring that the response does not reveal whether the email or password was incorrect
    if (!result.ok) {
      expect(result.error).toBe(
        "The email or password you entered is incorrect. Please try again.",
      );
    }
  });

  // Test 6 — verify messages are identical
  it("uses the same vague message for missing user and wrong password", async () => {
    // Define a vague error message to be used for both cases of missing user and wrong password
    const vagueMessage =
      "The email or password you entered is incorrect. Please try again.";

    // Case 1: user doesn't exist
    mockDb.user.findUnique.mockResolvedValue(null);

    // Call the loginUser function with an email that does not exist in the database
    const missingUserResult = await loginUser({
      email: "john@example.com",
      password: "password123",
    });

    // Case 2: user exists but password is wrong
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      passwordHash: "hashed-password",
      name: "John",
      createdAt: new Date(),
      updateAt: new Date(),
    });

    // Mock the comparePassword function to return false
    // (indicating the provided password does not match the stored password hash)
    mockComparePassword.mockResolvedValue(false);

    // Call the loginUser function with the correct email but an incorrect password
    const wrongPasswordResult = await loginUser({
      email: "john@example.com",
      password: "wrong",
    });

    // Assert that both results indicate failure and contain the same vague error message
    expect(missingUserResult).toEqual({
      ok: false,
      error: vagueMessage,
    });

    // Assert that both results indicate failure and contain the same vague error message
    expect(wrongPasswordResult).toEqual({
      ok: false,
      error: vagueMessage,
    });
  });

  // Test 7 — successful login
  it("returns ok: true with tokens on success", async () => {
    // Mock the database to return a user object when searching for the user by email (indicating the user exists)
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      passwordHash: "hashed-password",
      name: "John",
      createdAt: new Date(),
      updateAt: new Date(),
    });

    // Mock the comparePassword function to return true
    // (indicating the provided password matches the stored password hash)
    mockComparePassword.mockResolvedValue(true);

    // Mock the signToken, generateRefreshToken, and hashToken functions to return specific values
    mockSignToken.mockReturnValue("access-token");
    mockGenerateRefreshToken.mockReturnValue("refresh-token");
    mockHashToken.mockReturnValue("hashed-refresh-token");

    // Mock the database to return a new refresh token object when creating a refresh token
    mockDb.refreshToken.create.mockResolvedValue({} as any);

    // Call the loginUser function with valid credentials
    const result = await loginUser({
      email: "john@example.com",
      password: "password123",
    });

    // Assert that the result indicates success and contains the expected token data
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.accessToken).toBe("access-token");
      expect(result.data.refreshToken).toBe("refresh-token");
      expect(result.data.user.email).toBe("john@example.com");
    }
  });
});

// REFRESH TOKEN CASES
describe("refreshToken", () => {
  // Test 8 — token doesn't exist
  it("returns ok: false when token is not found", async () => {
    // Mock the hashToken function to return a specific hashed token value
    mockHashToken.mockReturnValue("hashed-token");

    // Mock the database to return null when searching for the refresh token (indicating the token does not exist)
    mockDb.refreshToken.findUnique.mockResolvedValue(null);

    // Call the refreshToken function with a raw refresh token that does not exist in the database
    const result = await refreshToken("raw-refresh-token");

    // Assert that the result indicates failure and contains the correct error message
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(
        "Invalid or expired refresh token. Please log in again.",
      );
    }
  });

  // Test 9 — token expired
  it("returns ok: false when token is expired", async () => {
    // Mock the hashToken function to return a specific hashed token value
    mockHashToken.mockReturnValue("hashed-token");

    // Mock the database to return a refresh token object with an expiration date in the past (indicating the token is expired)
    mockDb.refreshToken.findUnique.mockResolvedValue({
      id: "refresh-1",
      userId: "user-1",
      tokenHash: "hashed-token",
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      createdAt: new Date(),
    });

    // Call the refreshToken function with a raw refresh token that is expired
    const result = await refreshToken("raw-refresh-token");

    // Assert that the result indicates failure and contains the correct error message
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(
        "Invalid or expired refresh token. Please log in again.",
      );
    }
  });

  // Test 10 — revoked token reuse
  it("revokes all active sessions when a revoked token is reused", async () => {
    // Mock the hashToken function to return a specific hashed token value
    mockHashToken.mockReturnValue("hashed-token");

    // Mock the database to return a refresh token object that has been revoked (indicating the token is being reused)
    mockDb.refreshToken.findUnique.mockResolvedValue({
      id: "refresh-A",
      userId: "user-1",
      tokenHash: "hashed-token",
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    });

    // Mock the database to return a count of revoked tokens when updating multiple refresh tokens for the user
    mockDb.refreshToken.updateMany.mockResolvedValue({
      count: 2,
    });

    // Call the refreshToken function with a raw refresh token that has been revoked
    const result = await refreshToken("raw-refresh-token");

    // Assert that the result indicates failure and contains the correct error message
    expect(result.ok).toBe(false);

    // Assert that the error message indicates that all sessions have been revoked
    expect(mockDb.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  // Test 11 — valid refresh token
  it("returns ok: true with new tokens on valid token", async () => {
    // Mock the hashToken function to return specific hashed token values for the old and new tokens
    mockHashToken
      .mockReturnValueOnce("hashed-old-token")
      .mockReturnValueOnce("hashed-new-token");

    // Mock the database to return a refresh token object that is valid (not expired or revoked)
    mockDb.refreshToken.findUnique.mockResolvedValue({
      id: "refresh-A",
      userId: "user-1",
      tokenHash: "hashed-old-token",
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      createdAt: new Date(),
    });

    // Mock the signToken and generateRefreshToken functions to return new token values
    mockSignToken.mockReturnValue("new-access-token");
    mockGenerateRefreshToken.mockReturnValue("new-refresh-token");

    // Mock Prisma array transaction
    mockDb.$transaction.mockResolvedValue([{}, {}]);

    // Call the refreshToken function with a valid old refresh token
    const result = await refreshToken("old-refresh-token");

    // Assert that the result indicates success and contains the expected new token data
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.accessToken).toBe("new-access-token");
      expect(result.data.newRefreshToken).toBe("new-refresh-token");
    }

    // Verify that $transaction was used
    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});
