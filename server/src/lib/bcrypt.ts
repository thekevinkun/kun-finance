import bcrypt from "bcryptjs";

// Hash a plain text password before saving it to the database
export const hashPassword = async (password: string) => {
  // Higher = slower to crack, but also slower to hash (10 is a good balance)
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// Compare a plain-text password against a stored hash
// Returns true if they match, false if not
// bcrypt handles the salt internally — we don't need to extract it manually
export const comparePassword = async (
  plainPassword: string, // What the user typed at login
  hashedPassword: string, // What we have stored in the database
) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
