// 极简单管理员鉴权：HMAC 签名的会话 Cookie。Web Crypto 实现，middleware(edge) 与 server action(node) 通用。

export const COOKIE = "pl_admin";

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

// 常量时间字符串比较
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const PAYLOAD = "admin";

export async function signSession(secret: string): Promise<string> {
  return `${PAYLOAD}.${await hmac(secret, PAYLOAD)}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const p = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (p !== PAYLOAD || !sig) return false;
  return safeEqual(sig, await hmac(secret, p));
}
