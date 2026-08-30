/** Persistent storage for versioned, chunked ONNX model binaries. */
export interface ModelShard {
  name: string;
  version: string;
  index?: number;
  data: ArrayBuffer;
  size?: number;
}
export interface ModelSource {
  name: string;
  version: string;
  /** A complete .onnx file or ordered binary shards. */ urls: readonly string[];
}
interface StoredShard {
  id: string;
  name: string;
  version: string;
  index: number;
  data: ArrayBuffer;
  size: number;
  timestamp: number;
}
const DB_NAME = '3wm-sonik-model-cache';
const STORE = 'onnx-shards';
const DB_VERSION = 2;
const id = (name: string, version: string, index: number) => `${name}:${version}:${index}`;

export class ModelCacheService {
  private static instance: ModelCacheService | null = null;
  private db: IDBDatabase | null = null;
  private directory: FileSystemDirectoryHandle | null = null;
  static getInstance(): ModelCacheService {
    return (this.instance ??= new ModelCacheService());
  }

  async initialize(): Promise<boolean> {
    if (this.db) return true;
    if (typeof indexedDB === 'undefined') return false;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE))
          request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      this.directory = await navigator.storage?.getDirectory?.();
    } catch {
      /* IndexedDB is the fallback. */
    }
    return true;
  }

  async getModel(
    source: ModelSource,
    onProgress?: (percent: number, message: string) => void
  ): Promise<ArrayBuffer> {
    await this.initialize();
    const buffers: ArrayBuffer[] = [];
    for (let index = 0; index < source.urls.length; index++) {
      onProgress?.(
        (index / source.urls.length) * 40,
        `Loading model shard ${index + 1}/${source.urls.length}`
      );
      let data = await this.getShard(source.name, source.version, index);
      if (!data) {
        const response = await fetch(source.urls[index], { cache: 'force-cache' });
        if (!response.ok)
          throw new Error(`Unable to download model shard ${index + 1}: ${response.status}`);
        data = await response.arrayBuffer();
        await this.storeShard({ name: source.name, version: source.version, index, data });
      }
      buffers.push(data);
    }
    const merged = new Uint8Array(buffers.reduce((size, buffer) => size + buffer.byteLength, 0));
    let offset = 0;
    for (const buffer of buffers) {
      merged.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    return merged.buffer;
  }

  async hasShard(name: string, version: string, index = 0): Promise<boolean> {
    return (await this.getShard(name, version, index)) !== null;
  }
  async getShard(name: string, version: string, index = 0): Promise<ArrayBuffer | null> {
    const fileName = `${encodeURIComponent(name)}-${encodeURIComponent(version)}-${index}.onnx`;
    if (this.directory)
      try {
        return await (
          await this.directory.getFileHandle(fileName)
        )
          .getFile()
          .then((file) => file.arrayBuffer());
      } catch {
        /* try IDB */
      }
    if (!this.db) return null;
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(STORE)
        .objectStore(STORE)
        .get(id(name, version, index));
      request.onsuccess = () => resolve((request.result as StoredShard | undefined)?.data ?? null);
      request.onerror = () => reject(request.error);
    });
  }
  async storeShard(shard: ModelShard): Promise<void> {
    const index = shard.index ?? 0;
    const data = shard.data.slice(0);
    const fileName = `${encodeURIComponent(shard.name)}-${encodeURIComponent(shard.version)}-${index}.onnx`;
    if (this.directory) {
      const handle = await this.directory.getFileHandle(fileName, { create: true });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    }
    if (!this.db) return;
    const record: StoredShard = {
      id: id(shard.name, shard.version, index),
      name: shard.name,
      version: shard.version,
      index,
      data,
      size: shard.size ?? data.byteLength,
      timestamp: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const request = this.db!.transaction(STORE, 'readwrite').objectStore(STORE).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
export const modelCache = ModelCacheService.getInstance();
