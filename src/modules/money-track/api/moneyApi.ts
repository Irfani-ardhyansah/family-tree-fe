import { apiFetch, ApiClientError } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type {
  MoneyActivityItem,
  MoneyDashboardMock,
  MoneyJointPocket,
  MoneyPersonCard,
  MoneyPersonRole,
  MoneyPocketCategory,
} from '@/modules/money-track/types';
import type { MoneyDataSource } from '@/modules/money-track/lib/dataSource';

export type MoneySetupResponse = {
  isConfigured: boolean;
  mode: 'single' | 'couple' | null;
  persons: Array<{
    id: number;
    name: string;
    role: MoneyPersonRole;
    userId: number | null;
    familyRootsPersonId: number | null;
  }>;
  coupleLinkedAt: string | null;
  needsOpeningBalances: boolean;
};

export type MoneyDashboardApi = {
  period: { yearMonth: string; label: string };
  scope: 'all' | 'person';
  mode: 'single' | 'couple';
  summary: MoneyDashboardMock['summary'];
  persons: Array<{
    id: number;
    name: string;
    role: MoneyPersonRole;
    initial: string;
    totalBalance: number;
    pockets: Array<{
      id: number;
      name: string;
      category: MoneyPocketCategory;
      balance: number;
      accountName: string;
    }>;
  }>;
  jointPockets: Array<{
    id: number;
    name: string;
    balance: number;
    goalAmount: number | null;
    goalDate: string | null;
    progressPct: number | null;
  }>;
  recentActivity: MoneyActivityItem[];
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    dueAt: string | null;
    relatedType: string;
    relatedId: number;
    link?: string;
  }>;
  reminders: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    dueAt: string | null;
    relatedType: string;
    relatedId: number;
    link?: string;
  }>;
};

export type MoneyAccountApi = {
  id: number;
  personId: number;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  bankName: string | null;
};

export type MoneyPocketApi = {
  id: number;
  accountId: number;
  ownerType: 'person' | 'joint';
  ownerPersonId: number | null;
  category: MoneyPocketCategory;
  name: string;
  goalAmount: number | null;
  goalDate: string | null;
  isSystem: boolean;
  archivedAt: string | null;
  balance: number;
  account: { id: number; name: string; type: string };
  /** false → sembunyikan aksi hapus/archive (sistem / archived / saldo ≠ 0) */
  canArchive?: boolean;
};

export type MoneyTransactionApi = {
  id: number;
  pocketId: number;
  pocketName?: string | null;
  accountName?: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  type: string;
  amount: number;
  date: string;
  note: string | null;
  attachmentMediaId: string | null;
  createdByPersonId: number;
  personId?: number | null;
  personName?: string | null;
};

export type MoneyActivityApi = {
  id: string;
  kind: 'income' | 'expense' | 'transfer' | 'cash_withdrawal';
  title: string;
  categoryName: string | null;
  categoryId: number | null;
  personId: number | null;
  personName: string | null;
  pocketLabel: string;
  pocketId: number | null;
  amount: number;
  date: string;
  signed: 'pos' | 'neg' | 'neutral';
  link: string;
};

export type MoneyWishlistApi = {
  id: number;
  personId: number | null;
  name: string;
  estimatedPrice: number;
  priority: 'low' | 'medium' | 'high';
  linkedPocketId: number | null;
  imageMediaId: string | null;
  purchasedAt: string | null;
  progressAmount?: number;
  progressPct?: number;
};

export type MoneyDebtPaymentApi = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  createdByPersonId: number;
};

export type MoneyDebtApi = {
  id: number;
  personId: number;
  counterpartyName: string;
  direction: 'utang' | 'piutang';
  directionLabel?: string;
  amount: number;
  date: string;
  dueDate: string | null;
  status: 'open' | 'partial' | 'paid';
  note: string | null;
  paidTotal?: number;
  remaining?: number;
  remainingLabel?: string;
  payments?: MoneyDebtPaymentApi[];
};

export type MoneyBalancingApi = {
  pocketId: number;
  name: string;
  accountName: string;
  ownerPersonId: number | null;
  recordedBalance: number;
};

export type MoneyCategoryApi = {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  sortOrder: number;
  isSystem: boolean;
};

export type MoneyUiCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  sortOrder: number;
  isSystem: boolean;
};

export async function fetchMoneyCategories(
  type?: 'income' | 'expense',
): Promise<MoneyCategoryApi[]> {
  const query = buildQuery({ type });
  const data = await apiFetch<MoneyCategoryApi[] | { items: MoneyCategoryApi[] }>(
    `/money/categories${query}`,
  );
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function createMoneyCategory(input: {
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
}): Promise<MoneyCategoryApi> {
  return apiFetch<MoneyCategoryApi>('/money/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      type: input.type,
      icon: input.icon ?? null,
    }),
  });
}

export async function updateMoneyCategory(
  id: string,
  input: { name?: string; icon?: string | null; sortOrder?: number },
): Promise<MoneyCategoryApi> {
  return apiFetch<MoneyCategoryApi>(`/money/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMoneyCategory(
  id: string,
): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/money/categories/${id}`, {
    method: 'DELETE',
  });
}

export function mapCategoryToUi(row: MoneyCategoryApi): MoneyUiCategory {
  return {
    id: sid(row.id),
    name: row.name,
    type: row.type,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isSystem: row.isSystem,
  };
}

export type MoneyUiAccount = {
  id: string;
  personId: string | null;
  personName: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  pockets: Array<{
    id: string;
    name: string;
    category: MoneyPocketCategory;
    balance: number;
    goalAmount?: number;
    goalPct?: number;
    joint?: boolean;
    isSystem?: boolean;
    /** false → sembunyikan icon hapus */
    canDelete: boolean;
  }>;
};

export type MoneyUiArchivedPocket = {
  id: string;
  name: string;
  category: MoneyPocketCategory;
  balance: number;
  accountId: string;
  accountName: string;
  personId: string | null;
  personName: string;
  joint: boolean;
  archivedAt: string | null;
};

export type MoneyUiTx = {
  id: string;
  dateLabel: string;
  /** YYYY-MM-DD for date filters */
  dateIso: string;
  title: string;
  category: string;
  categoryId: string | null;
  person: string;
  personId: string;
  pocket: string;
  pocketId: string;
  kind: 'income' | 'expense' | 'transfer' | 'cash_withdrawal';
  amount: number;
};

export type MoneyUiWish = {
  id: string;
  name: string;
  estimatedPrice: number;
  priority: 'low' | 'medium' | 'high';
  person: string;
  personId: string | null;
  linkedPocket: string | null;
  progressAmount: number;
  progressPct: number;
  note: string | null;
};

export type MoneyUiDebt = {
  id: string;
  counterparty: string;
  direction: 'utang' | 'piutang';
  directionLabel: string;
  person: string;
  personId: string;
  amount: number;
  paidTotal: number;
  remaining: number;
  remainingLabel: string;
  status: 'open' | 'partial' | 'paid';
  dateLabel: string;
  dueLabel: string;
  dueSoon: boolean;
  note: string | null;
};

export type MoneyUiBalancing = {
  id: string;
  pocketName: string;
  accountName: string;
  person: string;
  personId: string | null;
  recorded: number;
  actual: number;
  diff: number;
};

function sid(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatGoalDateLabel(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 14;
}

export function mapDashboardToUi(
  api: MoneyDashboardApi,
  loginPersonId?: string,
): MoneyDashboardMock {
  const persons: MoneyPersonCard[] = api.persons.map((p) => ({
    id: sid(p.id),
    name: p.name,
    role: p.role,
    initial: p.initial || p.name.slice(0, 1).toUpperCase(),
    totalBalance: p.totalBalance,
    pockets: p.pockets.map((pocket) => ({
      id: sid(pocket.id),
      name: pocket.name,
      category: pocket.category,
      balance: pocket.balance,
      accountName: pocket.accountName,
    })),
  }));

  const jointPockets: MoneyJointPocket[] = api.jointPockets.map((j) => ({
    id: sid(j.id),
    name: j.name,
    balance: j.balance,
    goalAmount: j.goalAmount,
    goalDateLabel: formatGoalDateLabel(j.goalDate),
    progressPct: j.progressPct ?? 0,
  }));

  // alerts = balance_mismatch (dll); reminders = debt_due / budget_*.
  // Jangan copy debt/budget ke alerts di BE — FE gabung hanya untuk tampilan.
  const mapBanner = (
    a: MoneyDashboardApi['alerts'][number] | MoneyDashboardApi['reminders'][number],
  ) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    href:
      a.link ||
      (a.relatedType === 'pocket' || a.type === 'balance_mismatch'
        ? '/money/balancing'
        : a.relatedType === 'debt'
          ? `/money/debts/${a.relatedId}`
          : a.relatedType === 'budget'
            ? '/money/budgets'
            : '/money'),
  });

  const alerts = [
    ...api.alerts.filter((a) => a.type === 'balance_mismatch'),
    ...api.reminders.filter(
      (a) => a.type === 'debt_due' || a.type.startsWith('budget'),
    ),
  ].map(mapBanner);

  return {
    mode: api.mode,
    periodLabel: api.period.label,
    loginPersonId:
      loginPersonId ||
      persons.find((p) => p.role === 'husband' || p.role === 'self')?.id ||
      persons[0]?.id ||
      '',
    persons,
    jointPockets,
    summary: api.summary,
    recentActivity: api.recentActivity,
    alerts,
  };
}

export async function fetchMoneySetup(): Promise<MoneySetupResponse> {
  return apiFetch<MoneySetupResponse>('/money/setup');
}

export async function fetchMoneyDashboard(params?: {
  period?: string;
  scope?: 'all' | 'person';
  personId?: string;
}): Promise<MoneyDashboardApi> {
  const query = buildQuery({
    period: params?.period,
    scope: params?.scope,
    personId: params?.personId,
  });
  return apiFetch<MoneyDashboardApi>(`/money/dashboard${query}`);
}

export async function fetchMoneyAccounts(personId?: string): Promise<MoneyAccountApi[]> {
  const query = buildQuery({ personId });
  const data = await apiFetch<MoneyAccountApi[] | { items: MoneyAccountApi[] }>(
    `/money/accounts${query}`,
  );
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function createMoneyAccount(input: {
  personId: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  bankName?: string | null;
}): Promise<MoneyAccountApi> {
  return apiFetch<MoneyAccountApi>('/money/accounts', {
    method: 'POST',
    body: JSON.stringify({
      personId: Number(input.personId),
      name: input.name,
      type: input.type,
      bankName: input.bankName ?? null,
    }),
  });
}

export async function updateMoneyAccount(
  id: string,
  input: { name?: string; bankName?: string | null },
): Promise<MoneyAccountApi> {
  return apiFetch<MoneyAccountApi>(`/money/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMoneyAccount(
  id: string,
): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/money/accounts/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchMoneyPockets(personId?: string): Promise<MoneyPocketApi[]> {
  const query = buildQuery({
    personId,
    includeArchived: 'true',
  });
  const data = await apiFetch<MoneyPocketApi[] | { items: MoneyPocketApi[] }>(
    `/money/pockets${query}`,
  );
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function createMoneyPocket(input: {
  accountId: string;
  name: string;
  category: MoneyPocketCategory;
  ownerType?: 'person' | 'joint';
  goalAmount?: number | null;
  goalDate?: string | null;
}): Promise<MoneyPocketApi> {
  return apiFetch<MoneyPocketApi>('/money/pockets', {
    method: 'POST',
    body: JSON.stringify({
      accountId: Number(input.accountId),
      name: input.name,
      category: input.category,
      ownerType: input.ownerType ?? 'person',
      goalAmount: input.goalAmount ?? null,
      goalDate: input.goalDate ?? null,
    }),
  });
}

export async function updateMoneyPocket(
  id: string,
  input: {
    name?: string;
    category?: MoneyPocketCategory;
    goalAmount?: number | null;
    goalDate?: string | null;
  },
): Promise<MoneyPocketApi> {
  return apiFetch<MoneyPocketApi>(`/money/pockets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function archiveMoneyPocket(
  id: string,
): Promise<MoneyPocketApi> {
  return apiFetch<MoneyPocketApi>(`/money/pockets/${id}/archive`, {
    method: 'POST',
  });
}

export async function unarchiveMoneyPocket(
  id: string,
): Promise<MoneyPocketApi> {
  return apiFetch<MoneyPocketApi>(`/money/pockets/${id}/unarchive`, {
    method: 'POST',
  });
}

export async function fetchMoneyTransactions(params?: {
  personId?: string;
  pocketId?: string;
  categoryId?: string;
  type?: string;
  from?: string;
  to?: string;
  q?: string;
  uncategorized?: boolean;
  pageSize?: number;
  page?: number;
}): Promise<MoneyTransactionApi[]> {
  const query = buildQuery({
    personId: params?.personId,
    pocketId: params?.pocketId,
    categoryId: params?.categoryId,
    type: params?.type,
    from: params?.from,
    to: params?.to,
    q: params?.q,
    uncategorized:
      params?.uncategorized === true
        ? 'true'
        : params?.uncategorized === false
          ? 'false'
          : undefined,
    page: params?.page != null ? String(params.page) : undefined,
    pageSize: params?.pageSize != null ? String(params.pageSize) : '50',
  });
  const data = await apiFetch<{ items: MoneyTransactionApi[] }>(
    `/money/transactions${query}`,
  );
  return data.items ?? [];
}

export async function fetchMoneyActivity(params?: {
  personId?: string;
  pocketId?: string;
  categoryId?: string;
  kind?: 'all' | 'income' | 'expense' | 'transfer' | 'cash_withdrawal';
  from?: string;
  to?: string;
  q?: string;
  uncategorized?: boolean;
  pageSize?: number;
  page?: number;
}): Promise<{ items: MoneyActivityApi[]; total: number; page: number; pageSize: number }> {
  const query = buildQuery({
    personId: params?.personId,
    pocketId: params?.pocketId,
    categoryId: params?.categoryId,
    kind: params?.kind && params.kind !== 'all' ? params.kind : undefined,
    from: params?.from,
    to: params?.to,
    q: params?.q,
    uncategorized: params?.uncategorized === true ? 'true' : undefined,
    page: params?.page != null ? String(params.page) : '1',
    pageSize: params?.pageSize != null ? String(params.pageSize) : '50',
  });
  const data = await apiFetch<{
    items: MoneyActivityApi[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/money/activity${query}`);
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 50,
  };
}

export function mapActivityToUiTx(row: MoneyActivityApi): MoneyUiTx {
  return {
    id: row.id,
    dateLabel: formatDateLabel(row.date),
    dateIso: row.date,
    title: row.title,
    category: row.categoryName ?? (row.kind === 'transfer' ? 'Transfer' : row.kind === 'cash_withdrawal' ? 'Cash' : '—'),
    categoryId: row.categoryId != null ? sid(row.categoryId) : null,
    person: row.personName ?? '—',
    personId: row.personId != null ? sid(row.personId) : '',
    pocket: row.pocketLabel,
    pocketId: row.pocketId != null ? sid(row.pocketId) : '',
    kind: row.kind,
    amount: row.amount,
  };
}

export async function fetchMoneyWishlist(): Promise<MoneyWishlistApi[]> {
  const data = await apiFetch<MoneyWishlistApi[] | { items: MoneyWishlistApi[] }>(
    '/money/wishlist',
  );
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function fetchMoneyDebts(): Promise<MoneyDebtApi[]> {
  const data = await apiFetch<MoneyDebtApi[] | { items: MoneyDebtApi[] }>(
    '/money/debts',
  );
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function fetchMoneyDebtById(id: string): Promise<MoneyDebtApi> {
  return apiFetch<MoneyDebtApi>(`/money/debts/${id}`);
}

export async function fetchMoneyBalancing(): Promise<MoneyBalancingApi[]> {
  const data = await apiFetch<MoneyBalancingApi[] | { items: MoneyBalancingApi[] }>(
    '/money/balancing',
  );
  return Array.isArray(data) ? data : (data.items ?? []);
}

export function buildAccountsUi(
  accounts: MoneyAccountApi[],
  pockets: MoneyPocketApi[],
  persons: Array<{ id: string; name: string }>,
): MoneyUiAccount[] {
  const personName = new Map(persons.map((p) => [p.id, p.name]));
  const byAccount = new Map<number, MoneyPocketApi[]>();
  for (const pocket of pockets) {
    if (pocket.archivedAt) continue;
    const list = byAccount.get(pocket.accountId) ?? [];
    list.push(pocket);
    byAccount.set(pocket.accountId, list);
  }

  return accounts.map((acc) => ({
    id: sid(acc.id),
    personId: sid(acc.personId),
    personName: personName.get(sid(acc.personId)) ?? `Person ${acc.personId}`,
    name: acc.name,
    type: acc.type,
    pockets: (byAccount.get(acc.id) ?? []).map((p) => ({
      id: sid(p.id),
      name: p.name,
      category: p.category,
      balance: p.balance,
      goalAmount: p.goalAmount ?? undefined,
      goalPct:
        p.goalAmount && p.goalAmount > 0
          ? Math.round((p.balance / p.goalAmount) * 100)
          : undefined,
      joint: p.ownerType === 'joint',
      isSystem: p.isSystem,
      canDelete:
        p.canArchive ?? (!p.isSystem && !p.archivedAt && p.balance === 0),
    })),
  }));
}

export function buildArchivedPocketsUi(
  accounts: MoneyAccountApi[],
  pockets: MoneyPocketApi[],
  persons: Array<{ id: string; name: string }>,
): MoneyUiArchivedPocket[] {
  const personName = new Map(persons.map((p) => [p.id, p.name]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return pockets
    .filter((p) => Boolean(p.archivedAt))
    .map((p) => {
      const acc = accountMap.get(p.accountId);
      const personId =
        p.ownerPersonId != null
          ? sid(p.ownerPersonId)
          : acc
            ? sid(acc.personId)
            : null;
      return {
        id: sid(p.id),
        name: p.name,
        category: p.category,
        balance: p.balance,
        accountId: sid(p.accountId),
        accountName: acc?.name ?? p.account?.name ?? 'Account',
        personId,
        personName: personId
          ? (personName.get(personId) ?? `Person ${personId}`)
          : 'Bersama',
        joint: p.ownerType === 'joint',
        archivedAt: p.archivedAt,
      };
    })
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));
}

export function buildTransactionsUi(
  rows: MoneyTransactionApi[],
  pockets: MoneyPocketApi[],
  persons: Array<{ id: string; name: string }>,
  categories: MoneyUiCategory[] = [],
): MoneyUiTx[] {
  const pocketMap = new Map(pockets.map((p) => [p.id, p]));
  const personMap = new Map(persons.map((p) => [p.id, p.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return rows.map((row) => {
    const pocket = pocketMap.get(row.pocketId);
    const personId =
      row.personId != null
        ? sid(row.personId)
        : sid(pocket?.ownerPersonId ?? row.createdByPersonId);
    const categoryId = row.categoryId != null ? sid(row.categoryId) : null;
    const category =
      row.categoryName ??
      (categoryId
        ? (categoryMap.get(categoryId)?.name ?? `Kategori ${categoryId}`)
        : row.type === 'opening_balance'
          ? 'Opening'
          : row.type === 'adjustment'
            ? 'Adjustment'
            : row.type);

    const kind: MoneyUiTx['kind'] =
      row.type === 'income' || row.type === 'expense' ? row.type : 'expense';

    const pocketLabel =
      row.pocketName && row.accountName
        ? `${row.pocketName} · ${row.accountName}`
        : pocket
          ? `${pocket.name} · ${pocket.account.name}`
          : `Pocket ${row.pocketId}`;

    return {
      id: sid(row.id),
      dateLabel: formatDateLabel(row.date),
      dateIso: row.date,
      title: row.note?.trim() || category,
      category,
      categoryId,
      person: row.personName ?? personMap.get(personId) ?? '—',
      personId,
      pocket: pocketLabel,
      pocketId: sid(row.pocketId),
      kind,
      amount: row.amount,
    };
  });
}

export function buildWishlistUi(
  rows: MoneyWishlistApi[],
  persons: Array<{ id: string; name: string }>,
  pockets: MoneyPocketApi[],
): MoneyUiWish[] {
  const personMap = new Map(persons.map((p) => [p.id, p.name]));
  const pocketMap = new Map(pockets.map((p) => [p.id, p]));

  return rows.map((row) => {
    const personId = row.personId != null ? sid(row.personId) : null;
    const linked = row.linkedPocketId != null ? pocketMap.get(row.linkedPocketId) : null;
    return {
      id: sid(row.id),
      name: row.name,
      estimatedPrice: row.estimatedPrice,
      priority: row.priority,
      person: personId ? (personMap.get(personId) ?? '—') : 'Bersama',
      personId,
      linkedPocket: linked?.name ?? null,
      progressAmount: row.progressAmount ?? 0,
      progressPct: row.progressPct ?? 0,
      note: null,
    };
  });
}

export function buildDebtsUi(
  rows: MoneyDebtApi[],
  persons: Array<{ id: string; name: string }>,
): MoneyUiDebt[] {
  const personMap = new Map(persons.map((p) => [p.id, p.name]));
  return rows.map((row) => {
    const personId = sid(row.personId);
    const paidTotal = row.paidTotal ?? 0;
    const remaining = row.remaining ?? Math.max(0, row.amount - paidTotal);
    const isPiutang = row.direction === 'piutang';
    return {
      id: sid(row.id),
      counterparty: row.counterpartyName,
      direction: row.direction,
      directionLabel:
        row.directionLabel ?? (isPiutang ? 'Piutang' : 'Utang'),
      person: personMap.get(personId) ?? '—',
      personId,
      amount: row.amount,
      paidTotal,
      remaining,
      remainingLabel:
        row.remainingLabel ??
        (isPiutang ? 'Sisa piutang' : 'Sisa utang'),
      status: row.status,
      dateLabel: formatDateLabel(row.date),
      dueLabel: row.dueDate ? formatDateLabel(row.dueDate) : '—',
      dueSoon: row.status !== 'paid' && isDueSoon(row.dueDate),
      note: row.note,
    };
  });
}

export function buildBalancingUi(
  rows: MoneyBalancingApi[],
  persons: Array<{ id: string; name: string }>,
): MoneyUiBalancing[] {
  const personMap = new Map(persons.map((p) => [p.id, p.name]));
  return rows.map((row) => {
    const personId = row.ownerPersonId != null ? sid(row.ownerPersonId) : null;
    return {
      id: sid(row.pocketId),
      pocketName: row.name,
      accountName: row.accountName,
      person: personId ? (personMap.get(personId) ?? '—') : 'Bersama',
      personId,
      recorded: row.recordedBalance,
      actual: row.recordedBalance,
      diff: 0,
    };
  });
}

export function isMoneyNotConfigured(error: unknown): boolean {
  return (
    error instanceof ApiClientError && error.code === 'MONEY_NOT_CONFIGURED'
  );
}

export type MoneyBundle = {
  dataSource: MoneyDataSource;
  setup: MoneySetupResponse;
  dashboard: MoneyDashboardMock;
  accounts: MoneyUiAccount[];
  archivedPockets: MoneyUiArchivedPocket[];
  transactions: MoneyUiTx[];
  wishlist: MoneyUiWish[];
  debts: MoneyUiDebt[];
  balancing: MoneyUiBalancing[];
  categories: MoneyUiCategory[];
};

export async function loadMoneyApiBundle(): Promise<MoneyBundle> {
  const setup = await fetchMoneySetup();
  if (!setup.isConfigured) {
    return {
      dataSource: 'api',
      setup,
      dashboard: {
        mode: setup.mode === 'single' ? 'single' : 'couple',
        periodLabel: '—',
        loginPersonId: '',
        persons: setup.persons.map((p) => ({
          id: sid(p.id),
          name: p.name,
          role: p.role,
          initial: p.name.slice(0, 1).toUpperCase(),
          totalBalance: 0,
          pockets: [],
        })),
        jointPockets: [],
        summary: {
          income: 0,
          expense: 0,
          net: 0,
          incomeChangePct: 0,
          expenseChangePct: 0,
          totalSavings: 0,
        },
        recentActivity: [],
        alerts: [],
      },
      accounts: [],
      archivedPockets: [],
      transactions: [],
      wishlist: [],
      debts: [],
      balancing: [],
      categories: [],
    };
  }

  // Selalu ambil scope=all agar pill Gabungan/Irfan/Ayu tetap ada;
  // filter tampilan dilakukan di FE.
  const [
    dashboardApi,
    accounts,
    pockets,
    activity,
    wishlist,
    debts,
    balancing,
    categories,
  ] = await Promise.all([
      fetchMoneyDashboard({ scope: 'all' }),
      fetchMoneyAccounts(),
      fetchMoneyPockets(),
      fetchMoneyActivity({ pageSize: 50, kind: 'all' }),
      fetchMoneyWishlist(),
      fetchMoneyDebts(),
      fetchMoneyBalancing(),
      fetchMoneyCategories(),
    ]);

  const dashboard = mapDashboardToUi(dashboardApi);
  const persons = dashboard.persons.map((p) => ({ id: p.id, name: p.name }));
  const categoryUi = categories.map(mapCategoryToUi);

  return {
    dataSource: 'api',
    setup,
    dashboard,
    accounts: buildAccountsUi(accounts, pockets, persons),
    archivedPockets: buildArchivedPocketsUi(accounts, pockets, persons),
    transactions: activity.items.map(mapActivityToUiTx),
    wishlist: buildWishlistUi(wishlist, persons, pockets),
    debts: buildDebtsUi(debts, persons),
    balancing: buildBalancingUi(balancing, persons),
    categories: categoryUi,
  };
}
