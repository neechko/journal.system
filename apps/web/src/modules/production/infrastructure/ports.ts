export interface StoredPublicObject {
  content: Uint8Array;
  sha256: string;
  contentType: string;
  byteSize: number;
}

export interface PublicStorage {
  store(content: Uint8Array, contentType: string): Promise<{ storageKey: string; sha256: string }>;
  read(storageKey: string): Promise<StoredPublicObject>;
  remove(storageKey: string): Promise<void>;
}