import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "customer" | "admin";
}

function getJwtSecret() {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env.local");
  }

  return JWT_SECRET;
}

export function generateToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}