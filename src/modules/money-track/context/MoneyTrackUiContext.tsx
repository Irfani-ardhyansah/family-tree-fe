import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  MoneyModalPayload,
  MoneyModalState,
  MoneyModalType,
} from '@/modules/money-track/components/modals/modalTypes';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/modules/money-track/components/modals/modalTypes';
import {
  emptyMoneyDashboard,
  addMoneyOpeningPocketIds,
  canUseMoneyDummySource,
  clearMoneyOpeningPocketIds,
  readMoneyDataSource,
  readMoneyOpeningPocketIds,
  readMoneySampleDataCleared,
  writeMoneyDataSource,
  writeMoneySampleDataCleared,
  type MoneyDataSource,
} from '@/modules/money-track/lib/dataSource';
import { moneyDashboardMock } from '@/modules/money-track/mocks/dashboardMock';
import {
  moneyAccountsMock,
  moneyBalancingMock,
  moneyDebtsMock,
  moneyTransactionsMock,
  moneyWishlistMock,
} from '@/modules/money-track/mocks/pagesMock';
import {
  createMoneyCategory,
  deleteMoneyCategory,
  isMoneyNotConfigured,
  loadMoneyApiBundle,
  mapCategoryToUi,
  resetMoneyWorkspace,
  submitOpeningBalances as submitOpeningBalancesApi,
  unarchiveMoneyPocket,
  updateMoneyCategory,
  type MoneySetupResponse,
  type MoneyUiAccount,
  type MoneyUiArchivedPocket,
  type MoneyUiBalancing,
  type MoneyUiCategory,
  type MoneyUiDebt,
  type MoneyUiTx,
  type MoneyUiWish,
  type MoneyWorkspaceResetMode,
} from '@/modules/money-track/api/moneyApi';
import type { MoneyDashboardMock, MoneyScope } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';

type TxRow = MoneyUiTx;
type AccRow = MoneyUiAccount;
type WishRow = MoneyUiWish;
type DebtRow = MoneyUiDebt;
type BalRow = MoneyUiBalancing;
type CatRow = MoneyUiCategory;
type PocketRow = AccRow['pockets'][number];
type ArchivedPocketRow = MoneyUiArchivedPocket;

function seedDummyCategories(): CatRow[] {
  const expense = EXPENSE_CATEGORIES.map((c, i) => ({
    id: c.id,
    name: c.name,
    type: 'expense' as const,
    icon: c.emoji,
    sortOrder: i + 1,
    isSystem: true,
  }));
  const income = INCOME_CATEGORIES.map((c, i) => ({
    id: c.id,
    name: c.name,
    type: 'income' as const,
    icon: c.emoji,
    sortOrder: i + 1,
    isSystem: true,
  }));
  return [...expense, ...income];
}

type MoneyTrackUiContextValue = {
  dataSource: MoneyDataSource;
  setDataSource: (source: MoneyDataSource) => void;
  /** True hanya VITE_APP_ENV=development — boleh switch Dummy/API. */
  canUseDummySource: boolean;
  data: MoneyDashboardMock;
  transactions: TxRow[];
  accounts: AccRow[];
  archivedPockets: ArchivedPocketRow[];
  wishlist: WishRow[];
  debts: DebtRow[];
  balancing: BalRow[];
  categories: CatRow[];
  scope: MoneyScope;
  setScope: (scope: MoneyScope) => void;
  scopeLabel: string;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  apiReady: boolean;
  apiLoading: boolean;
  apiError: string | null;
  setup: MoneySetupResponse | null;
  refreshApi: () => Promise<void>;
  /** Naik tiap kali transaksi/activity berubah — list Transaksi refetch. */
  activityTick: number;
  bumpActivity: () => void;
  activeModal: MoneyModalState;
  openModal: (type: MoneyModalType, payload?: MoneyModalPayload) => void;
  closeModal: () => void;
  appendTransaction: (row: TxRow) => void;
  patchTransaction: (id: string, patch: Partial<TxRow>) => void;
  removeTransaction: (id: string) => void;
  appendAccount: (row: AccRow) => void;
  appendPocket: (accountId: string, pocket: PocketRow) => void;
  patchAccount: (accountId: string, patch: { name: string }) => void;
  removeAccount: (accountId: string) => void;
  patchPocket: (
    accountId: string,
    pocketId: string,
    patch: Partial<PocketRow>,
  ) => void;
  removePocket: (accountId: string, pocketId: string) => void;
  restorePocket: (pocketId: string) => Promise<void>;
  appendWishlist: (row: WishRow) => void;
  appendDebt: (row: DebtRow) => void;
  patchDebt: (id: string, patch: Partial<DebtRow>) => void;
  removeDebt: (id: string) => void;
  appendDebtPayment: (debtId: string, amount: number) => void;
  applyAdjustment: (balancingRowId: string, actual: number) => void;
  createCategory: (input: {
    name: string;
    type: 'income' | 'expense';
    icon?: string | null;
  }) => Promise<CatRow>;
  updateCategory: (
    id: string,
    input: { name?: string; icon?: string | null },
  ) => Promise<CatRow>;
  removeCategory: (id: string) => Promise<void>;
  /** true setelah "Hapus Data Contoh" sukses (local fallback). */
  sampleDataCleared: boolean;
  /**
   * Tampilkan tombol Hapus Data Contoh.
   * Prefer flag API `setup.hasSampleData`; fallback localStorage.
   */
  showWipeSampleButton: boolean;
  /** Pocket yang belum punya opening balance (siap diisi di halaman Saldo Awal). */
  pendingOpeningPockets: Array<{
    id: string;
    name: string;
    accountName: string;
    personName: string;
    personId: string;
    balance: number;
  }>;
  /** true jika masih ada pocket pending + workflow saldo awal aktif. */
  needsOpeningBalancesUi: boolean;
  submitOpeningBalances: (input: {
    date: string;
    items: Array<{ pocketId: string; amount: number }>;
  }) => Promise<void>;
  /**
   * Hapus data contoh Money Track di database (workspace login).
   * Hanya relevan di mode API. Setelah sukses, refresh bundle + sembunyikan tombol.
   */
  resetApiWorkspace: (input?: {
    mode?: MoneyWorkspaceResetMode;
    keepSetup?: boolean;
  }) => Promise<void>;
};

const MoneyTrackUiContext = createContext<MoneyTrackUiContextValue | null>(
  null,
);

function cloneAccounts() {
  return structuredClone(moneyAccountsMock) as AccRow[];
}

function toCategoryError(error: unknown, fallback: string): Error {
  if (error instanceof ApiClientError) return new Error(error.message);
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function MoneyTrackUiProvider({ children }: { children: ReactNode }) {
  const canUseDummySource = canUseMoneyDummySource();
  const [dataSource, setDataSourceState] = useState<MoneyDataSource>(() =>
    readMoneyDataSource(),
  );
  const [scope, setScope] = useState<MoneyScope>('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<MoneyModalState>(null);

  const [dummyTx, setDummyTx] = useState<TxRow[]>(() => [...moneyTransactionsMock]);
  const [dummyAccounts, setDummyAccounts] = useState<AccRow[]>(cloneAccounts);
  const [dummyArchivedPockets, setDummyArchivedPockets] = useState<
    ArchivedPocketRow[]
  >([]);
  const [dummyWishlist, setDummyWishlist] = useState<WishRow[]>(() => [
    ...moneyWishlistMock,
  ]);
  const [dummyDebts, setDummyDebts] = useState<DebtRow[]>(() => [
    ...moneyDebtsMock,
  ]);
  const [dummyBalancing, setDummyBalancing] = useState<BalRow[]>(() => [
    ...moneyBalancingMock,
  ]);
  const [dummyCategories, setDummyCategories] = useState<CatRow[]>(seedDummyCategories);

  const [apiDashboard, setApiDashboard] =
    useState<MoneyDashboardMock>(emptyMoneyDashboard);
  const [apiAccounts, setApiAccounts] = useState<AccRow[]>([]);
  const [apiArchivedPockets, setApiArchivedPockets] = useState<
    ArchivedPocketRow[]
  >([]);
  const [apiTx, setApiTx] = useState<TxRow[]>([]);
  const [apiWishlist, setApiWishlist] = useState<WishRow[]>([]);
  const [apiDebts, setApiDebts] = useState<DebtRow[]>([]);
  const [apiBalancing, setApiBalancing] = useState<BalRow[]>([]);
  const [apiCategories, setApiCategories] = useState<CatRow[]>([]);
  const [apiOpeningPocketIds, setApiOpeningPocketIds] = useState<string[]>([]);
  const [localOpeningPocketIds, setLocalOpeningPocketIds] = useState<string[]>(
    () => readMoneyOpeningPocketIds(),
  );
  const [sampleDataCleared, setSampleDataCleared] = useState(() =>
    readMoneySampleDataCleared(),
  );
  const [activityTick, setActivityTick] = useState(0);
  const bumpActivity = useCallback(() => {
    setActivityTick((n) => n + 1);
  }, []);
  const [setup, setSetup] = useState<MoneySetupResponse | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const setDataSource = (source: MoneyDataSource) => {
    // Non-development (deployment): kunci ke API, tidak boleh dummy.
    const next = canUseDummySource ? source : 'api';
    setDataSourceState(next);
    writeMoneyDataSource(next);
    setScope('all');
    setActiveModal(null);
    setApiError(null);
  };

  // Deployment / production: pastikan state tidak tertinggal di dummy.
  useEffect(() => {
    if (!canUseDummySource && dataSource !== 'api') {
      setDataSourceState('api');
      writeMoneyDataSource('api');
    }
  }, [canUseDummySource, dataSource]);

  const refreshApi = useCallback(async () => {
    if (dataSource !== 'api') return;
    setApiLoading(true);
    setApiError(null);
    try {
      const bundle = await loadMoneyApiBundle();
      setSetup(bundle.setup);
      setApiDashboard(bundle.dashboard);
      setApiAccounts(bundle.accounts);
      setApiArchivedPockets(bundle.archivedPockets);
      setApiTx(bundle.transactions);
      setApiWishlist(bundle.wishlist);
      setApiDebts(bundle.debts);
      setApiBalancing(bundle.balancing);
      setApiCategories(bundle.categories);
      setApiOpeningPocketIds(bundle.openingPocketIds);
      setApiReady(bundle.setup.isConfigured);
      // Tombol wipe: BE false → sembunyi permanen.
      // Jangan reset local cleared saat BE masih true (bisa lag setelah wipe).
      if (bundle.setup.hasSampleData === false) {
        writeMoneySampleDataCleared(true);
        setSampleDataCleared(true);
      }
    } catch (error) {
      if (isMoneyNotConfigured(error)) {
        setSetup({
          isConfigured: false,
          mode: null,
          persons: [],
          coupleLinkedAt: null,
          needsOpeningBalances: false,
          hasSampleData: false,
        });
        setApiDashboard(emptyMoneyDashboard);
        setApiAccounts([]);
        setApiArchivedPockets([]);
        setApiTx([]);
        setApiWishlist([]);
        setApiDebts([]);
        setApiBalancing([]);
        setApiCategories([]);
        setApiOpeningPocketIds([]);
        setApiReady(false);
        setApiError(null);
      } else {
        setApiReady(false);
        setApiError(
          error instanceof ApiClientError
            ? error.message
            : 'Gagal memuat data Money Track dari API.',
        );
      }
    } finally {
      setApiLoading(false);
    }
  }, [dataSource]);

  useEffect(() => {
    if (dataSource !== 'api') {
      setApiReady(false);
      setApiLoading(false);
      setApiError(null);
      return;
    }
    void refreshApi();
  }, [dataSource, refreshApi]);

  const usingDummy = dataSource === 'dummy';
  const data = usingDummy ? moneyDashboardMock : apiDashboard;
  const transactions = usingDummy ? dummyTx : apiTx;
  const accounts = usingDummy ? dummyAccounts : apiAccounts;
  const archivedPockets = usingDummy
    ? dummyArchivedPockets
    : apiArchivedPockets;
  const wishlist = usingDummy ? dummyWishlist : apiWishlist;
  const debts = usingDummy ? dummyDebts : apiDebts;
  const balancing = usingDummy ? dummyBalancing : apiBalancing;
  const categories = usingDummy ? dummyCategories : apiCategories;

  const openModal = useCallback(
    (type: MoneyModalType, payload?: MoneyModalPayload) => {
      setQuickAddOpen(false);
      setActiveModal({ type, payload });
    },
    [],
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  const resetApiWorkspace = useCallback(
    async (input?: {
      mode?: MoneyWorkspaceResetMode;
      keepSetup?: boolean;
    }) => {
      if (dataSource !== 'api') {
        throw new Error('Hapus data contoh hanya tersedia di mode API.');
      }
      setApiLoading(true);
      setApiError(null);
      try {
        await resetMoneyWorkspace({
          mode: input?.mode ?? 'wipe',
          keepSetup: input?.keepSetup ?? true,
        });
        if ((input?.mode ?? 'wipe') === 'wipe') {
          writeMoneySampleDataCleared(true);
          setSampleDataCleared(true);
          clearMoneyOpeningPocketIds();
          setLocalOpeningPocketIds([]);
          setSetup((prev) =>
            prev ? { ...prev, hasSampleData: false } : prev,
          );
        }
        await refreshApi();
      } catch (error) {
        setApiError(
          error instanceof ApiClientError
            ? error.message
            : 'Gagal menghapus data Money Track di database.',
        );
        throw error;
      } finally {
        setApiLoading(false);
      }
    },
    [dataSource, refreshApi],
  );

  const appendTransaction = useCallback(
    (row: TxRow) => {
      setDummyTx((prev) => [row, ...prev]);
      setDummyAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          pockets: acc.pockets.map((p) => {
            if (p.id !== row.pocketId) return p;
            const delta =
              row.kind === 'income'
                ? row.amount
                : row.kind === 'expense'
                  ? -row.amount
                  : 0;
            return { ...p, balance: p.balance + delta };
          }),
        })),
      );
      setActivityTick((n) => n + 1);
    },
    [],
  );

  const patchTransaction = useCallback((id: string, patch: Partial<TxRow>) => {
    setDummyTx((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
    setActivityTick((n) => n + 1);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setDummyTx((prev) => {
      const target = prev.find((row) => row.id === id);
      if (target && (target.kind === 'income' || target.kind === 'expense')) {
        const delta =
          target.kind === 'income' ? -target.amount : target.amount;
        setDummyAccounts((accounts) =>
          accounts.map((acc) => ({
            ...acc,
            pockets: acc.pockets.map((p) =>
              p.id === target.pocketId
                ? { ...p, balance: p.balance + delta }
                : p,
            ),
          })),
        );
      }
      return prev.filter((row) => row.id !== id);
    });
    setActivityTick((n) => n + 1);
  }, []);

  const appendAccount = useCallback((row: AccRow) => {
    setDummyAccounts((prev) => [...prev, row]);
  }, []);

  const appendPocket = useCallback((accountId: string, pocket: PocketRow) => {
    setDummyAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, pockets: [...acc.pockets, pocket] }
          : acc,
      ),
    );
  }, []);

  const patchAccount = useCallback(
    (accountId: string, patch: { name: string }) => {
      setDummyAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, name: patch.name } : acc,
        ),
      );
    },
    [],
  );

  const removeAccount = useCallback((accountId: string) => {
    setDummyAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
  }, []);

  const patchPocket = useCallback(
    (accountId: string, pocketId: string, patch: Partial<PocketRow>) => {
      setDummyAccounts((prev) =>
        prev.map((acc) =>
          acc.id !== accountId
            ? acc
            : {
                ...acc,
                pockets: acc.pockets.map((p) =>
                  p.id === pocketId ? { ...p, ...patch } : p,
                ),
              },
        ),
      );
    },
    [],
  );

  const removePocket = useCallback((accountId: string, pocketId: string) => {
    setDummyAccounts((prev) =>
      prev.map((row) =>
        row.id !== accountId
          ? row
          : {
              ...row,
              pockets: row.pockets.filter((p) => p.id !== pocketId),
            },
      ),
    );
  }, []);

  const restorePocket = useCallback(
    async (pocketId: string) => {
      if (dataSource === 'api') {
        await unarchiveMoneyPocket(pocketId);
        await refreshApi();
        return;
      }

      const archived = dummyArchivedPockets.find((p) => p.id === pocketId);
      if (!archived) throw new Error('Pocket archived tidak ditemukan.');

      setDummyArchivedPockets((prev) => prev.filter((p) => p.id !== pocketId));
      setDummyAccounts((prev) =>
        prev.map((acc) =>
          acc.id !== archived.accountId
            ? acc
            : {
                ...acc,
                pockets: [
                  ...acc.pockets,
                  {
                    id: archived.id,
                    name: archived.name,
                    category: archived.category,
                    balance: archived.balance,
                    joint: archived.joint,
                    isSystem: false,
                    canDelete: true,
                  },
                ],
              },
        ),
      );
    },
    [dataSource, dummyArchivedPockets, refreshApi],
  );

  const appendWishlist = useCallback((row: WishRow) => {
    setDummyWishlist((prev) => [...prev, row]);
  }, []);

  const appendDebt = useCallback((row: DebtRow) => {
    setDummyDebts((prev) => [...prev, row]);
  }, []);

  const patchDebt = useCallback((id: string, patch: Partial<DebtRow>) => {
    setDummyDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDummyDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const appendDebtPayment = useCallback((debtId: string, amount: number) => {
    setDummyDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const paidTotal = d.paidTotal + amount;
        const remaining = Math.max(0, d.amount - paidTotal);
        const status =
          remaining === 0 ? 'paid' : paidTotal > 0 ? 'partial' : 'open';
        return {
          ...d,
          paidTotal,
          remaining,
          status: status as DebtRow['status'],
        };
      }),
    );
  }, []);

  const applyAdjustment = useCallback(
    (balancingRowId: string, actual: number) => {
      setDummyBalancing((prev) =>
        prev.map((row) =>
          row.id === balancingRowId
            ? { ...row, recorded: actual, actual, diff: 0 }
            : row,
        ),
      );
    },
    [],
  );

  const createCategory = useCallback(
    async (input: {
      name: string;
      type: 'income' | 'expense';
      icon?: string | null;
    }) => {
      if (dataSource === 'dummy') {
        const row: CatRow = {
          id: `cat-${Date.now()}`,
          name: input.name,
          type: input.type,
          icon: input.icon ?? null,
          sortOrder:
            dummyCategories.filter((c) => c.type === input.type).length + 1,
          isSystem: false,
        };
        setDummyCategories((prev) => [...prev, row]);
        return row;
      }
      try {
        const created = mapCategoryToUi(await createMoneyCategory(input));
        setApiCategories((prev) => [...prev, created]);
        return created;
      } catch (error) {
        throw toCategoryError(error, 'Gagal menambah kategori.');
      }
    },
    [dataSource, dummyCategories],
  );

  const updateCategory = useCallback(
    async (
      id: string,
      input: { name?: string; icon?: string | null },
    ) => {
      if (dataSource === 'dummy') {
        let updated: CatRow | null = null;
        setDummyCategories((prev) =>
          prev.map((row) => {
            if (row.id !== id) return row;
            updated = {
              ...row,
              name: input.name ?? row.name,
              icon: input.icon !== undefined ? input.icon : row.icon,
            };
            return updated;
          }),
        );
        if (!updated) throw new Error('Kategori tidak ditemukan.');
        return updated;
      }
      try {
        const next = mapCategoryToUi(await updateMoneyCategory(id, input));
        setApiCategories((prev) =>
          prev.map((row) => (row.id === id ? next : row)),
        );
        return next;
      } catch (error) {
        throw toCategoryError(error, 'Gagal mengubah kategori.');
      }
    },
    [dataSource],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      if (dataSource === 'dummy') {
        const existing = dummyCategories.find((c) => c.id === id);
        if (!existing) throw new Error('Kategori tidak ditemukan.');
        if (existing.isSystem) {
          throw new Error('Kategori sistem tidak boleh dihapus.');
        }
        setDummyCategories((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      try {
        await deleteMoneyCategory(id);
        setApiCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (error) {
        throw toCategoryError(error, 'Gagal menghapus kategori.');
      }
    },
    [dataSource, dummyCategories],
  );

  const scopeLabel = useMemo(() => {
    if (scope === 'all') {
      if (data.persons.length === 0) {
        return dataSource === 'api'
          ? apiLoading
            ? 'Memuat…'
            : 'API (belum ada person)'
          : 'Semua';
      }
      if (data.mode === 'couple') {
        const names = data.persons.map((p) => p.name).join(' & ');
        return `Gabungan (${names})`;
      }
      return 'Pribadi';
    }
    const person = data.persons.find((p) => p.id === scope);
    return person?.name ?? 'Person';
  }, [data, scope, dataSource, apiLoading]);

  const openingPocketIdSet = useMemo(() => {
    const set = new Set<string>([
      ...localOpeningPocketIds,
      ...apiOpeningPocketIds,
    ]);
    for (const tx of transactions) {
      if (tx.entryType === 'opening_balance' || tx.category === 'Opening') {
        set.add(tx.pocketId);
      }
    }
    return set;
  }, [localOpeningPocketIds, apiOpeningPocketIds, transactions]);

  const pendingOpeningPockets = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      accountName: string;
      personName: string;
      personId: string;
      balance: number;
    }> = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        if (openingPocketIdSet.has(p.id)) continue;
        list.push({
          id: p.id,
          name: p.name,
          accountName: acc.name,
          personName: acc.personName,
          personId: acc.personId ?? '',
          balance: p.balance,
        });
      }
    }
    return list;
  }, [accounts, openingPocketIdSet]);

  const needsOpeningBalancesUi = useMemo(() => {
    if (pendingOpeningPockets.length === 0) return false;
    if (setup?.needsOpeningBalances) return true;
    if (dataSource === 'api') {
      return sampleDataCleared || localOpeningPocketIds.length > 0;
    }
    return true;
  }, [
    pendingOpeningPockets.length,
    setup?.needsOpeningBalances,
    dataSource,
    sampleDataCleared,
    localOpeningPocketIds.length,
  ]);

  const showWipeSampleButton = useMemo(() => {
    if (dataSource !== 'api') return false;
    // Setelah wipe lokal, sembunyi meski BE flag belum ikut.
    if (sampleDataCleared) return false;
    // Hanya tampil bila BE eksplisit bilang masih ada sample.
    return setup?.hasSampleData === true;
  }, [dataSource, sampleDataCleared, setup?.hasSampleData]);

  const submitOpeningBalances = useCallback(
    async (input: {
      date: string;
      items: Array<{ pocketId: string; amount: number }>;
    }) => {
      const pocketIds = input.items.map((item) => item.pocketId);
      if (dataSource === 'api') {
        await submitOpeningBalancesApi(input);
        addMoneyOpeningPocketIds(pocketIds);
        setLocalOpeningPocketIds(readMoneyOpeningPocketIds());
        await refreshApi();
      } else {
        const amountByPocket = new Map(
          input.items.map((item) => [item.pocketId, item.amount]),
        );
        setDummyAccounts((prev) =>
          prev.map((acc) => ({
            ...acc,
            pockets: acc.pockets.map((p) => {
              const amount = amountByPocket.get(p.id);
              return amount === undefined ? p : { ...p, balance: amount };
            }),
          })),
        );
        setDummyBalancing((prev) =>
          prev.map((row) => {
            const amount = amountByPocket.get(row.id);
            if (amount === undefined) return row;
            return {
              ...row,
              recorded: amount,
              actual: amount,
              diff: 0,
            };
          }),
        );
        addMoneyOpeningPocketIds(pocketIds);
        setLocalOpeningPocketIds(readMoneyOpeningPocketIds());
      }
    },
    [dataSource, refreshApi],
  );

  const value = useMemo(
    () => ({
      dataSource,
      setDataSource,
      canUseDummySource,
      data,
      transactions,
      accounts,
      archivedPockets,
      wishlist,
      debts,
      balancing,
      categories,
      scope,
      setScope,
      scopeLabel,
      quickAddOpen,
      setQuickAddOpen,
      apiReady,
      apiLoading,
      apiError,
      setup,
      refreshApi,
      activityTick,
      bumpActivity,
      activeModal,
      openModal,
      closeModal,
      appendTransaction,
      patchTransaction,
      removeTransaction,
      appendAccount,
      appendPocket,
      patchAccount,
      removeAccount,
      patchPocket,
      removePocket,
      restorePocket,
      appendWishlist,
      appendDebt,
      patchDebt,
      removeDebt,
      appendDebtPayment,
      applyAdjustment,
      createCategory,
      updateCategory,
      removeCategory,
      sampleDataCleared,
      showWipeSampleButton,
      pendingOpeningPockets,
      needsOpeningBalancesUi,
      submitOpeningBalances,
      resetApiWorkspace,
    }),
    [
      dataSource,
      canUseDummySource,
      data,
      transactions,
      accounts,
      archivedPockets,
      wishlist,
      debts,
      balancing,
      categories,
      scope,
      scopeLabel,
      quickAddOpen,
      apiReady,
      apiLoading,
      apiError,
      setup,
      refreshApi,
      activityTick,
      bumpActivity,
      activeModal,
      openModal,
      closeModal,
      appendTransaction,
      patchTransaction,
      removeTransaction,
      appendAccount,
      appendPocket,
      patchAccount,
      removeAccount,
      patchPocket,
      removePocket,
      restorePocket,
      appendWishlist,
      appendDebt,
      patchDebt,
      removeDebt,
      appendDebtPayment,
      applyAdjustment,
      createCategory,
      updateCategory,
      removeCategory,
      sampleDataCleared,
      showWipeSampleButton,
      pendingOpeningPockets,
      needsOpeningBalancesUi,
      submitOpeningBalances,
      resetApiWorkspace,
    ],
  );

  return (
    <MoneyTrackUiContext.Provider value={value}>
      {children}
    </MoneyTrackUiContext.Provider>
  );
}

export function useMoneyTrackUi() {
  const ctx = useContext(MoneyTrackUiContext);
  if (!ctx) {
    throw new Error('useMoneyTrackUi must be used within MoneyTrackUiProvider');
  }
  return ctx;
}
