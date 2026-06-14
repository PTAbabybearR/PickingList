import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// 仅在 Node 运行时(server action)使用；勿在 middleware(edge) 引入。

/** 生成 `salt:hash`（hex）。 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(password, salt, 32);
  return `${salt.toString("hex")}:${dk.toString("hex")}`;
}

/** 常量时间校验密码。 */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = (stored ?? "").split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const dk = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === dk.length && timingSafeEqual(dk, expected);
}
