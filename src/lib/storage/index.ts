import { LocalStorage } from "./local";

/**
 * 存储适配器接口。
 * MVP 用 LocalStorage(本地磁盘)；后期换云存储只需新增实现并在 getStorage 切换，
 * 业务代码不动。详见 PRD 第六节。
 */
export interface Storage {
  /** 写入文件 */
  put(key: string, data: Buffer | Uint8Array): Promise<void>;
  /** 读取文件字节 */
  read(key: string): Promise<Buffer>;
  /** 文件是否存在 */
  exists(key: string): Promise<boolean>;
  /** 删除文件（不存在时静默） */
  delete(key: string): Promise<void>;
}

let _storage: Storage | null = null;

export function getStorage(): Storage {
  if (!_storage) {
    _storage = new LocalStorage(process.env.STORAGE_DIR ?? "./storage");
  }
  return _storage;
}
