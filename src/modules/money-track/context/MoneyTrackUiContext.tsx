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
  readMoneyDataSource,
  writeMoneyDataSource,
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
  activeModal: MoneyModalState;
  openModal: (type: MoneyModalType, payload?: MoneyModalPayload) => void;
  closeModal: () => void;
  appendTransaction: (row: TxRow) => void;
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
  const [setup, setSetup] = useState<MoneySetupResponse | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const setDataSource = (source: MoneyDataSource) => {
    setDataSourceState(source);
    writeMoneyDataSource(source);
    setScope('all');
    setActiveModal(null);
    setApiError(null);
  };

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
      setApiReady(bundle.setup.isConfigured);
    } catch (error) {
      if (isMoneyNotConfigured(error)) {
        setSetup({
          isConfigured: false,
          mode: null,
          persons: [],
          coupleLinkedAt: null,
          needsOpeningBalances: false,
        });
        setApiDashboard(emptyMoneyDashboard);
        setApiAccounts([]);
        setApiArchivedPockets([]);
        setApiTx([]);
        setApiWishlist([]);
        setApiDebts([]);
        setApiBalancing([]);
        setApiCategories([]);
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

  const appendTransaction = useCallback((row: TxRow) => {
    setDummyTx((prev) => [row, ...prev]);
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
    let archived: ArchivedPocketRow | null = null;
    setDummyAccounts((prev) => {
      const acc = prev.find((a) => a.id === accountId);
      const pocket = acc?.pockets.find((p) => p.id === pocketId);
      if (acc && pocket) {
        archived = {
          id: pocket.id,
          name: pocket.name,
          category: pocket.category,
          balance: pocket.balance,
          accountId: acc.id,
          accountName: acc.name,
          personId: acc.personId,
          personName: acc.personName,
          joint: Boolean(pocket.joint),
          archivedAt: new Date().toISOString(),
        };
      }
      return prev.map((row) =>
        row.id !== accountId
          ? row
          : {
              ...row,
              pockets: row.pockets.filter((p) => p.id !== pocketId),
            },
      );
    });
    if (archived) {
      setDummyArchivedPockets((rows) => [archived!, ...rows]);
    }
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
                    canDelete: archived.balance === 0,
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

  const value = useMemo(
    () => ({
      dataSource,
      setDataSource,
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
      activeModal,
      openModal,
      closeModal,
      appendTransaction,
      appendAccount,
      appendPocket,
      patchAccount,
      removeAccount,
      patchPocket,
      removePocket,
      restorePocket,
      appendWishlist,
      appendDebt,
      appendDebtPayment,
      applyAdjustment,
      createCategory,
      updateCategory,
      removeCategory,
    }),
    [
      dataSource,
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
      activeModal,
      openModal,
      closeModal,
      appendTransaction,
      appendAccount,
      appendPocket,
      patchAccount,
      removeAccount,
      patchPocket,
      removePocket,
      restorePocket,
      appendWishlist,
      appendDebt,
      appendDebtPayment,
      applyAdjustment,
      createCategory,
      updateCategory,
      removeCategory,
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
