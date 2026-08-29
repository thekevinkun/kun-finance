import { User } from "@prisma/client";

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  user: Omit<User, "passwordHash">;
  accessToken: string;
  refreshToken: string;
};
