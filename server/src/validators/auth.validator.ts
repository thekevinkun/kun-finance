import { z } from "zod/v3";

// Small helper to avoid repeating .min(1)
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

// REGISTER ZOD SCHEMA
export const registerSchema = z
  .object({
    email: requiredString("Email")
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    password: requiredString("Password")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),

    confirmPassword: requiredString("Please confirm your password"),

    name: requiredString("Name").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

// LOGIN ZOD SCHEMA
export const loginSchema = z.object({
  email: requiredString("Email")
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),

  password: requiredString("Password"),
});

// Export Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// What the service actually needs
export type RegisterServiceInput = Omit<RegisterInput, "confirmPassword">;
