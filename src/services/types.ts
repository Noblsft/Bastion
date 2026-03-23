// ── Cipher ───────────────────────────────────────────────────────────────────

/** AEAD cipher used to encrypt all vault objects. Chosen at vault creation time. */
export type Cipher = 'aes256_gcm' | 'cha_cha20_poly1305';

// ── Vault ─────────────────────────────────────────────────────────────────────

/**
 * Returned after a vault is created or opened.
 * Contains only non-sensitive metadata — no key material is ever sent to the frontend.
 */
export type VaultHandle = {
  /** Absolute path to the vault directory on disk. */
  path: string;
  /** Cipher algorithm active for this vault. */
  cipher: Cipher;
};

// ── Files ─────────────────────────────────────────────────────────────────────

/** Compression algorithm applied to a file before encryption. */
export type Compression = 'zstd';

/**
 * Metadata for a file stored in the vault.
 * File content is not included — use `readFile` to retrieve bytes for a specific entry.
 */
export type FileEntry = {
  /** Stable UUID v4 assigned at creation. Does not change on content updates. */
  id: string;
  /** Human-readable filename (e.g. `"notes.md"`). */
  name: string;
  /** MIME type (e.g. `"text/markdown"`). Controls compression and search indexing. */
  mime: string;
  /** IDs of modules that reference this file. A file can be shared across multiple modules. */
  app_ids: string[];
  /** Original plaintext byte size, before compression. */
  size: number;
  /** SHA-256 hex digest of the original plaintext. Used for integrity verification. */
  integrity_hash: string;
  /** Compression applied before encryption, or `null` if stored uncompressed. */
  compression: Compression | null;
  /** ISO 8601 UTC timestamp of when the file was first created. */
  created_at: string;
  /** ISO 8601 UTC timestamp of the most recent content or metadata update. */
  updated_at: string;
};

// ── History ───────────────────────────────────────────────────────────────────

/**
 * Controls when automatic history snapshots are created.
 *
 * - `every_update` — snapshot before every content or metadata change (default).
 * - `interval` — snapshot only if at least `seconds` have elapsed since the last one.
 * - `manual` — never snapshot automatically; use `saveVersion` to trigger explicitly.
 */
export type TrackingMode =
  | { mode: 'every_update' }
  | { mode: 'interval'; seconds: number }
  | { mode: 'manual' };

/**
 * Controls how many snapshots are retained per file.
 *
 * - `forever` — keep every snapshot indefinitely (default).
 * - `keep_last` — delete the oldest snapshots so that at most `max` remain.
 */
export type RetentionPolicy = { policy: 'forever' } | { policy: 'keep_last'; max: number };

/** Vault-wide history configuration combining tracking mode and retention policy. */
export type HistoryConfig = {
  tracking: TrackingMode;
  retention: RetentionPolicy;
};

/**
 * Describes what triggered a history snapshot.
 *
 * - `content_updated` — file bytes were replaced.
 * - `metadata_updated` — only name, mime, or app_ids changed.
 * - `reverted` — file was restored to a previous version.
 */
export type ChangeType =
  | { kind: 'content_updated' }
  | { kind: 'metadata_updated' }
  | { kind: 'reverted'; to_version: string };

/**
 * A point-in-time snapshot of a file's mutable metadata fields.
 * Captures the state **before** the change that produced this history entry.
 */
export type FileEntrySnapshot = {
  name: string;
  mime: string;
  app_ids: string[];
  size: number;
  integrity_hash: string;
  compression: Compression | null;
};

/**
 * A single entry in a file's change history.
 * A matching content snapshot exists on disk and can be restored via `revertFile`.
 */
export type HistoryEntry = {
  /** UUID identifying this snapshot. Used as the `versionId` argument to `revertFile`. */
  version_id: string;
  /** ISO 8601 UTC timestamp of when the snapshot was taken. */
  timestamp: string;
  /** What kind of change produced this entry. */
  change_type: ChangeType;
  /** File metadata captured before the change was applied. */
  metadata: FileEntrySnapshot;
};

// ── Services ──────────────────────────────────────────────────────────────────

/** Shape of the shared services object injected via `useServices`. */
export type Services = {
  vaultService: {
    // ── Lifecycle ────────────────────────────────────────────────────────────

    /** Creates a new encrypted vault at `path` and leaves it open. */
    createVault: (path: string, passphrase: string, cipher: Cipher) => Promise<VaultHandle>;
    /** Opens an existing vault and verifies the passphrase via AEAD authentication. */
    openVault: (path: string, passphrase: string) => Promise<VaultHandle>;
    /** Closes the active vault and zeroes the master key from memory. */
    closeVault: () => Promise<void>;

    // ── Files ─────────────────────────────────────────────────────────────────

    /**
     * Encrypts `data` and stores it as a new file.
     * Pass an empty `appIds` array if the file is not app-specific.
     */
    createFile: (
      name: string,
      mime: string,
      appIds: string[],
      data: number[],
    ) => Promise<FileEntry>;
    /** Decrypts and returns the raw bytes of the file identified by `id`. */
    readFile: (id: string) => Promise<number[]>;
    /** Replaces the content of a file. Automatically snapshots based on tracking mode. */
    updateFile: (id: string, data: number[]) => Promise<FileEntry>;
    /** Updates only the metadata (name, mime, appIds) without touching file content. */
    updateFileMetadata: (
      id: string,
      name: string,
      mime: string,
      appIds: string[],
    ) => Promise<FileEntry>;
    /** Permanently removes a file, its index entry, and all history snapshots. */
    deleteFile: (id: string) => Promise<void>;
    /** Returns metadata for every file in the vault, ordered by insertion time. */
    listFiles: () => Promise<FileEntry[]>;
    /** Case-insensitive full-text search across indexed file content. */
    searchFiles: (query: string) => Promise<FileEntry[]>;

    // ── Settings ─────────────────────────────────────────────────────────────
    // TODO: This needs a separate service

    /**
     * Reads settings for `scope`.
     * Use `"global"` for vault-wide settings or an app ID (e.g. `"sigil"`) for app-specific ones.
     */
    getSettings: (scope: string) => Promise<unknown>;
    /**
     * Writes settings for `scope`, replacing the previous value entirely.
     * Read first and merge if partial updates are needed.
     */
    setSettings: (scope: string, value: unknown) => Promise<void>;

    // ── History ───────────────────────────────────────────────────────────────
    // TODO: This needs a separate service

    /** Returns the full change history for a file, ordered oldest-first. */
    getHistory: (fileId: string) => Promise<HistoryEntry[]>;
    /** Manually creates a snapshot of the current file state. */
    saveVersion: (fileId: string) => Promise<HistoryEntry>;
    /**
     * Destructively reverts a file to the state captured in `versionId`.
     * Call `saveVersion` first if the current state should be preserved.
     */
    revertFile: (fileId: string, versionId: string) => Promise<FileEntry>;
    /** Returns the vault-wide history configuration (tracking mode + retention policy). */
    getHistoryConfig: () => Promise<HistoryConfig>;
    /** Replaces the vault-wide history configuration. Takes effect on the next file operation. */
    setHistoryConfig: (config: HistoryConfig) => Promise<void>;
  };
};
