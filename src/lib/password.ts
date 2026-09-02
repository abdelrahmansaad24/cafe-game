import argon2 from "argon2";

import { env } from "@/lib/env";

const argon2Options = {
  type: argon2.argon2id as 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

function withPepper(password: string) {
  return `${password}${env.AUTH_PEPPER}`;
}

export async function hashPassword(password: string): Promise<string> {
  const hash = await argon2.hash(withPepper(password), argon2Options);
  if (typeof hash !== "string") {
    throw new TypeError("Unexpected binary hash output from argon2.");
  }
  return hash;
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, withPepper(password));
}
