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
import type { MoneyDashboardMock, MoneyScope } from '@/modules/money-track/types';

type TxRow = (typeof moneyTransactionsMock)[number];
type AccRow = (typeof moneyAccountsMock)[number];
type WishRow = (typeof moneyWishlistMock)[number];
type DebtRow = (typeof moneyDebtsMock)[number];
type BalRow = (typeof moneyBalancingMock)[number];
type PocketRow = AccRow['pockets'][number];

type MoneyTrackUiContextValue = {
  dataSource: MoneyDataSource;
  setDataSource: (source: MoneyDataSource) => void;
  data: MoneyDashboardMock;
  transactions: TxRow[];
  accounts: AccRow[];
  wishlist: WishRow[];
  debts: DebtRow[];
  balancing: BalRow[];
  scope: MoneyScope;
  setScope: (scope: MoneyScope) => void;
  scopeLabel: string;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  apiReady: boolean;
  activeModal: MoneyModalState;
  openModal: (type: MoneyModalType, payload?: MoneyModalPayload) => void;
  closeModal: () => void;
  appendTransaction: (row: TxRow) => void;
  appendAccount: (row: AccRow) => void;
  appendPocket: (accountId: string, pocket: PocketRow) => void;
  appendWishlist: (row: WishRow) => void;
  appendDebt: (row: DebtRow) => void;
  appendDebtPayment: (debtId: string, amount: number) => void;
  applyAdjustment: (balancingRowId: string, actual: number) => void;
};

const MoneyTrackUiContext = createContext<MoneyTrackUiContextValue | null>(
  null,
);

function cloneAccounts() {
  return structuredClone(moneyAccountsMock) as AccRow[];
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
  const [dummyWishlist, setDummyWishlist] = useState<WishRow[]>(() => [
    ...moneyWishlistMock,
  ]);
  const [dummyDebts, setDummyDebts] = useState<DebtRow[]>(() => [
    ...moneyDebtsMock,
  ]);
  const [dummyBalancing, setDummyBalancing] = useState<BalRow[]>(() => [
    ...moneyBalancingMock,
  ]);

  const setDataSource = (source: MoneyDataSource) => {
    setDataSourceState(source);
    writeMoneyDataSource(source);
    setScope('all');
    setActiveModal(null);
  };

  const apiReady = false;

  useEffect(() => {
    if (dataSource !== 'api') return;
  }, [dataSource]);

  const usingDummy = dataSource === 'dummy';
  const data = usingDummy ? moneyDashboardMock : emptyMoneyDashboard;
  const transactions = usingDummy ? dummyTx : [];
  const accounts = usingDummy ? dummyAccounts : [];
  const wishlist = usingDummy ? dummyWishlist : [];
  const debts = usingDummy ? dummyDebts : [];
  const balancing = usingDummy ? dummyBalancing : [];

  const openModal = useCallback(
    (type: MoneyModalType, payload?: MoneyModalPayload) => {
      setQuickAddOpen(false);
      setActiveModal({ type, payload });
    },
    [],
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  const appendTransaction = useCallback(
    (row: TxRow) => {
      setDummyTx((prev) => [row, ...prev]);
    },
    [],
  );

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

  const appendWishlist = useCallback((row: WishRow) => {
    setDummyWishlist((prev) => [row, ...prev]);
  }, []);

  const appendDebt = useCallback((row: DebtRow) => {
    setDummyDebts((prev) => [row, ...prev]);
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

  const scopeLabel = useMemo(() => {
    if (scope === 'all') {
      if (data.persons.length === 0) {
        return dataSource === 'api' ? 'API (kosong)' : 'Semua';
      }
      if (data.mode === 'couple') {
        const names = data.persons.map((p) => p.name).join(' & ');
        return `Gabungan (${names})`;
      }
      return 'Pribadi';
    }
    const person = data.persons.find((p) => p.id === scope);
    return person?.name ?? 'Person';
  }, [data, scope, dataSource]);

  const value = useMemo(
    () => ({
      dataSource,
      setDataSource,
      data,
      transactions,
      accounts,
      wishlist,
      debts,
      balancing,
      scope,
      setScope,
      scopeLabel,
      quickAddOpen,
      setQuickAddOpen,
      apiReady,
      activeModal,
      openModal,
      closeModal,
      appendTransaction,
      appendAccount,
      appendPocket,
      appendWishlist,
      appendDebt,
      appendDebtPayment,
      applyAdjustment,
    }),
    [
      dataSource,
      data,
      transactions,
      accounts,
      wishlist,
      debts,
      balancing,
      scope,
      scopeLabel,
      quickAddOpen,
      apiReady,
      activeModal,
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
