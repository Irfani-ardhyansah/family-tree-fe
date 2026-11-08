import { apiFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type {
  AdminMcpTokenItem,
  AdminMcpTokenListResponse,
  CreateMcpTokenInput,
  CreateMcpTokenResponse,
  McpTokenItem,
  McpTokenListResponse,
  McpTokenStatusFilter,
} from '@/shared/types/mcpToken';

/** Token MCP milik user yang sedang login. */
export async function listMyMcpTokens(): Promise<McpTokenItem[]> {
  const data = await apiFetch<McpTokenListResponse>('/auth/mcp-tokens');
  return data.items;
}

/**
 * Buat token MCP baru. `unlockToken` wajib dikirim kalau meminta modul
 * sensitif — apiClient tidak menambahkan X-Module-Unlock untuk route /auth.
 */
export async function createMyMcpToken(
  input: CreateMcpTokenInput,
  unlockToken?: string | null,
): Promise<CreateMcpTokenResponse> {
  const headers: Record<string, string> = {};
  if (unlockToken) {
    headers['X-Module-Unlock'] = unlockToken;
  }

  return apiFetch<CreateMcpTokenResponse>('/auth/mcp-tokens', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
}

/** Hapus/cabut token MCP milik sendiri. Double-click aman (idempotent). */
export async function revokeMyMcpToken(id: number): Promise<McpTokenItem> {
  const data = await apiFetch<{ revoked: boolean; item: McpTokenItem }>(
    `/auth/mcp-tokens/${id}`,
    { method: 'DELETE' },
  );
  return data.item;
}

/** Admin: semua token MCP di keluarga (maks. 200 dari server). */
export async function listAdminMcpTokens(query?: {
  status?: McpTokenStatusFilter;
  personId?: number;
}): Promise<AdminMcpTokenItem[]> {
  const data = await apiFetch<AdminMcpTokenListResponse>(
    `/admin/mcp-tokens${buildQuery({
      status: query?.status ?? 'all',
      personId: query?.personId != null ? String(query.personId) : undefined,
    })}`,
  );
  return data.items;
}

/** Admin: cabut paksa token MCP milik siapa pun di keluarga. */
export async function revokeAdminMcpToken(
  id: number,
): Promise<AdminMcpTokenItem> {
  const data = await apiFetch<{ revoked: boolean; item: AdminMcpTokenItem }>(
    `/admin/mcp-tokens/${id}/revoke`,
    { method: 'POST' },
  );
  return data.item;
}
