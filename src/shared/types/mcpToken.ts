/** Modul sensitif yang boleh di-"trust" ke token MCP. */
export const MCP_UNLOCK_MODULES = ['money', 'core', 'household'] as const;

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
   * `undefined` = ikuti unlock header (kalau ada).
   * `[]` = token tanpa modul sensitif.
   */
  modules?: McpUnlockModule[] | null;
};
