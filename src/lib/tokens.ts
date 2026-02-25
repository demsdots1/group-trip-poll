// src/lib/tokens.ts
import crypto from "crypto";

export function generateEditToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex"); // 64 chars for 32 bytes
}

export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}