import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper that builds a fake Express req/res/next triple
// This lets us call middleware directly without spinning up a server
const buildReqResNext = (token?: string) => {
  // Build a fake request object with the Authorization header set to the provided token
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cookies: {},
  } as any;

  // Build a fake response object with status and json methods that can be spied on
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;

  // Build a fake next function that can be spied on
  const next = vi.fn();

  // Return the fake req/res/next triple
  return { req, res, next };
};

// Mock function in jwt
vi.mock("../../lib/jwt.ts", () => ({
  verifyToken: vi.fn(),
}));

// Import the actual modules after mocking
import { authenticate } from "../authenticate";
import { verifyToken } from "../../lib/jwt";

// Gives TypeScript/Vitest proper knowledge that these are mocks
const mockVerifyToken = vi.mocked(verifyToken);

// Reset mocks before every test
beforeEach(() => {
  vi.clearAllMocks();
});

// Run tests
describe("authenticate", () => {
  // Test 1 - When no Authorization header
  it("returns 401 when no Authorization header", () => {
    // Build a fake req/res/next triple with no Authorization header
    const { req, res, next } = buildReqResNext();

    // Call the authenticate middleware with the fake req/res/next
    authenticate(req, res, next);

    // Expect the response status to be 401 and next() not to have been called
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // Test 2 - When token is invalid or expired
  it("returns 401 when token is invalid/expired", () => {
    // Build a fake req/res/next triple with an invalid token
    const { req, res, next } = buildReqResNext("invalid_token");

    // Mock verifyToken to return null, simulating an invalid or expired token
    mockVerifyToken.mockReturnValue(null);

    // Call the authenticate middleware with the fake req/res/next
    authenticate(req, res, next);

    // Expect the response status to be 401 and next() not to have been called
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // Test 3 - When token is valid
  it("calls next() and sets req.user when token is valid", () => {
    // Build a fake req/res/next triple with a valid token
    const { req, res, next } = buildReqResNext("user-1");

    // Mock verifyToken to return a valid payload, simulating a valid token
    mockVerifyToken.mockReturnValue({
      userId: "user-1",
    });

    // Call the authenticate middleware with the fake req/res/next
    authenticate(req, res, next);

    // Expect next() to have been called and req.user to be set correctly
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "user-1" });
  });
});
