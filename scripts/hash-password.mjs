import { scryptSync, randomBytes } from "node:crypto";

const pw = process.argv[2];
if (!pw) {
  console.error('用法: pnpm run hash-password "你的密码"');
  process.exit(1);
}
const salt = randomBytes(16);
const dk = scryptSync(pw, salt, 32);
console.log(`ADMIN_PASSWORD_HASH="${salt.toString("hex")}:${dk.toString("hex")}"`);
console.log("把上面这行复制进 .env（替换原值）。");
