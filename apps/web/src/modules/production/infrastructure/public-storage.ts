import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import "server-only";
import { AppError } from "@/modules/shared/app-error";
import type { StoredPublicObject, PublicStorage } from "./ports";

const storageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hashContent(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function getStoragePath(root: string, storageKey: string): string {
  if (!storageKeyPattern.test(storageKey)) {
    throw new AppError("INVALID_INPUT", "Invalid public storage key.");
  }
  return resolve(root, storageKey);
}

export class LocalPublicStorage implements PublicStorage {
  constructor(
    private readonly root = resolve(
      process.cwd(),
      ".public-storage",
      "articles"
    ),
  ) {}

  async store(content: Uint8Array, contentType: string): Promise<{ storageKey: string; sha256: string }> {
    await mkdir(this.root, { recursive: true, mode: 0o755 });
    const storageKey = randomUUID();
    await writeFile(getStoragePath(this.root, storageKey), content, {
      flag: "wx",
      mode: 0o644,
    });

    return { storageKey, sha256: hashContent(content) };
  }

  async read(storageKey: string): Promise<StoredPublicObject> {
    const content = new Uint8Array(await readFile(getStoragePath(this.root, storageKey)));
    return { content, sha256: hashContent(content), contentType: "application/pdf", byteSize: content.byteLength };
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await unlink(getStoragePath(this.root, storageKey));
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
  }
}

export function isLocalPublicStorageEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.LOCAL_PUBLIC_STORAGE_ENABLED === "true";
}

export function createPublicStorage(): PublicStorage {
  if (!isLocalPublicStorageEnabled()) {
    throw new AppError(
      "STORAGE_NOT_CONFIGURED",
      "Public file storage is not enabled. Local storage is development-only.",
    );
  }

  return new LocalPublicStorage();
}