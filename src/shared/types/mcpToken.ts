/** Modul yang otomatis diberikan ke semua token MCP (tanpa checkbox/unlock). */
export const MCP_DEFAULT_MODULES = ['money'] as const;
export type McpDefaultModule = (typeof MCP_DEFAULT_MODULES)[number];

/** Modul opsional yang boleh di-"trust" ke token MCP (butuh password kedua). */
export const MCP_OPTIONAL_MODULES = ['core', 'household'] as const;
export type McpOptionalModule = (typeof MCP_OPTIONAL_MODULES)[number];

/** Semua modul yang dikenal token MCP (default + opsional). */
export const MCP_UNLOCK_MODULES = [
  ...MCP_DEFAULT_MODULES,
  ...MCP_OPTIONAL_MODULES,
] as const;
export type McpUnlockModule = (typeof MCP_UNLOCK_MODULES)[number];

export type McpTokenItem = {
  id: number;
  label: string;
  tokenHint: string;
  unlocks: McpUnlockModule[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
};

export type AdminMcpTokenItem = McpTokenItem & {
  personId: number;
  personName: string;
};

export type McpTokenStatusFilter = 'active' | 'revoked' | 'all';

export type McpTokenListResponse = {
  items: McpTokenItem[];
};

export type AdminMcpTokenListResponse = {
  items: AdminMcpTokenItem[];
};

export type CreateMcpTokenResponse = {
  /** Token asli — hanya dikembalikan sekali. */
  token: string;
  item: McpTokenItem;
};

export type CreateMcpTokenInput = {
  label: string;
  /**
   * Hanya modul opsional (`core` / `household`). Money Track otomatis.
   * `undefined` / `[]` = akses default saja (Family Roots, Task Board, Money).
   */
  modules?: McpOptionalModule[] | null;
};
