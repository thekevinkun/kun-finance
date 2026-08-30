import { User } from "@prisma/client";

export type AuthResult = {
  user: Omit<User, "passwordHash">;
  accessToken: string;
  refreshToken: string;
};
