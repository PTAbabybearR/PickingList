import { promises as fs } from "node:fs";
import path from "node:path";
import type { Storage } from "./index";

/** 本地文件系统存储（MVP）。文件存于 root 目录下，root 已 .gitignore。 */
export class LocalStorage implements Storage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  /** 把 key 解析为 root 内的绝对路径，并防止路径穿越。 */
  private resolveKey(key: string): string {
    const target = path.resolve(this.root, key);
    const rel = path.relative(this.root, target);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(`非法存储 key（路径穿越）：${key}`);
    }
    return target;
  }

  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    const p = this.resolveKey(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, data);
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveKey(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolveKey(key));
    } catch {
      // 文件不存在时静默
    }
  }
}
