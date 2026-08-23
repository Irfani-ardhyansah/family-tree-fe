import type {
  MoneyMonthlyReportApi,
  MoneyUiTx,
} from '@/modules/money-track/api/moneyApi';

export type DayPoint = {
  dateIso: string;
  day: number;
  income: number;
  expense: number;
  net: number;
  cumulativeNet: number;
};

export type PersonBar = {
  personId: string;
  label: string;
  income: number;
  expense: number;
};

export type PocketBar = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export type MovesSummary = {
  transferCount: number;
  transferAmount: number;
  cashCount: number;
  cashAmount: number;
};

export type CategorySlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
};

export type MonthlyReportView = {
  periodLabel: string;
  previousPeriodLabel: string;
  income: number;
  expense: number;
  net: number;
  savingsRatePct: number | null;
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  netChangePct: number | null;
  prevIncome: number;
  prevExpense: number;
  prevNet: number;
  daily: DayPoint[];
  topExpenseDays: Array<{
    dateIso: string;
    day: number;
    expense: number;
    income: number;
  }>;
  categoryExpense: CategorySlice[];
  categoryIncome: CategorySlice[];
  pockets: PocketBar[];
  persons: PersonBar[];
  moves: MovesSummary;
  debts: {
    utang: number;
    piutang: number;
    dueSoon: number;
    count: number;
  };
  hasLedgerData: boolean;
};

const SLICE_COLORS = [
  '#6b5344',
  '#c06a5f',
  '#3d6b5a',
  '#c9a227',
  '#4a6fa5',
  '#8b5e3c',
  '#5c7a6e',
  '#b85c38',
  '#6e7f8d',
  '#9a7b4f',
];

function mapCategoryRows(
  rows: MoneyMonthlyReportApi['byCategory']['expense'],
): CategorySlice[] {
  return (rows ?? []).map((row, index) => ({
    key: String(row.categoryId ?? row.categoryName ?? index),
    label: row.categoryName || 'Tanpa kategori',
    amount: row.amount,
    pct: row.pct,
    color: SLICE_COLORS[index % SLICE_COLORS.length],
  }));
}

export function mapMoneyMonthlyReport(
  api: MoneyMonthlyReportApi,
): MonthlyReportView {
  const daily: DayPoint[] = (api.daily ?? []).map((d) => {
    const dateIso = d.date.slice(0, 10);
    return {
      dateIso,
      day: Number(dateIso.slice(8, 10)) || 1,
      income: d.income,
      expense: d.expense,
      net: d.net,
      cumulativeNet: d.cumulativeNet,
    };
  });

  const topExpenseDays = (api.topExpenseDays ?? []).map((d) => {
    const dateIso = d.date.slice(0, 10);
    return {
      dateIso,
      day: Number(dateIso.slice(8, 10)) || 1,
      expense: d.expense,
      income: d.income,
    };
  });

  const pockets: PocketBar[] = (api.byPocket ?? []).map((p, i) => {
    const name = p.pocketName || 'Tanpa kantong';
    const account = p.accountName?.trim();
    return {
      key: String(p.pocketId ?? `${name}-${i}`),
      label: account ? `${name} · ${account}` : name,
      income: p.income,
      expense: p.expense,
    };
  });

  const persons: PersonBar[] = (api.byPerson ?? []).map((p) => ({
    personId: String(p.personId),
    label: p.personName || '—',
    income: p.income,
    expense: p.expense,
  }));

  const income = api.summary?.income ?? 0;
  const expense = api.summary?.expense ?? 0;

  return {
    periodLabel: api.period?.label ?? api.period?.yearMonth ?? '',
    previousPeriodLabel:
      api.previousPeriod?.label ?? api.previousPeriod?.yearMonth ?? '',
    income,
    expense,
    net: api.summary?.net ?? income - expense,
    savingsRatePct: api.summary?.savingsRatePct ?? null,
    incomeChangePct: api.summary?.incomeChangePct ?? null,
    expenseChangePct: api.summary?.expenseChangePct ?? null,
    netChangePct: api.summary?.netChangePct ?? null,
    prevIncome: api.previousSummary?.income ?? 0,
    prevExpense: api.previousSummary?.expense ?? 0,
    prevNet: api.previousSummary?.net ?? 0,
    daily,
    topExpenseDays,
    categoryExpense: mapCategoryRows(api.byCategory?.expense ?? []),
    categoryIncome: mapCategoryRows(api.byCategory?.income ?? []),
    pockets,
    persons,
    moves: {
      transferCount: api.moves?.transfer?.count ?? 0,
      transferAmount: api.moves?.transfer?.amount ?? 0,
      cashCount: api.moves?.cashWithdrawal?.count ?? 0,
      cashAmount: api.moves?.cashWithdrawal?.amount ?? 0,
    },
    debts: {
      utang: api.debtsOpen?.utangRemaining ?? 0,
      piutang: api.debtsOpen?.piutangRemaining ?? 0,
      dueSoon: api.debtsOpen?.dueSoonCount ?? 0,
      count: api.debtsOpen?.openCount ?? 0,
    },
    hasLedgerData:
      income > 0 ||
      expense > 0 ||
      daily.some((d) => d.income + d.expense > 0),
  };
}

export function buildLocalMonthlyReport(input: {
  year: string;
  month: string;
  daysInMonth: number;
  periodLabel: string;
  previousPeriodLabel: string;
  currentRows: MoneyUiTx[];
  previousRows: MoneyUiTx[];
  debts: Array<{
    personId: string;
    direction: 'utang' | 'piutang';
    remaining: number;
    status: string;
    dueSoon: boolean;
  }>;
  scope: string;
}): MonthlyReportView {
  const ledger = input.currentRows.filter(
    (r) => r.kind === 'income' || r.kind === 'expense',
  );
  const prevLedger = input.previousRows.filter(
    (r) => r.kind === 'income' || r.kind === 'expense',
  );
  const income = sumByKind(ledger, 'income');
  const expense = sumByKind(ledger, 'expense');
  const prevIncome = sumByKind(prevLedger, 'income');
  const prevExpense = sumByKind(prevLedger, 'expense');
  const net = income - expense;
  const prevNet = prevIncome - prevExpense;
  const daily = buildDailySeries(
    ledger,
    input.year,
    input.month,
    input.daysInMonth,
  );
  const topExpenseDays = [...daily]
    .filter((d) => d.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 5)
    .map((d) => ({
      dateIso: d.dateIso,
      day: d.day,
      expense: d.expense,
      income: d.income,
    }));

  const scopedDebts = input.debts.filter((d) => {
    if (input.scope !== 'all' && d.personId !== input.scope) return false;
    return d.status !== 'paid';
  });
  let utang = 0;
  let piutang = 0;
  let dueSoon = 0;
  for (const d of scopedDebts) {
    if (d.direction === 'utang') utang += d.remaining;
    else piutang += d.remaining;
    if (d.dueSoon) dueSoon += 1;
  }

  return {
    periodLabel: input.periodLabel,
    previousPeriodLabel: input.previousPeriodLabel,
    income,
    expense,
    net,
    savingsRatePct: income > 0 ? ((income - expense) / income) * 100 : null,
    incomeChangePct: changePct(income, prevIncome),
    expenseChangePct: changePct(expense, prevExpense),
    netChangePct: changePct(net, prevNet),
    prevIncome,
    prevExpense,
    prevNet,
    daily,
    topExpenseDays,
    categoryExpense: buildCategorySlicesLocal(
      ledger.filter((r) => r.kind === 'expense'),
    ),
    categoryIncome: buildCategorySlicesLocal(
      ledger.filter((r) => r.kind === 'income'),
    ),
    pockets: buildPocketBars(ledger),
    persons: buildPersonBars(ledger),
    moves: buildMovesSummary(input.currentRows),
    debts: { utang, piutang, dueSoon, count: scopedDebts.length },
    hasLedgerData: ledger.length > 0,
  };
}

export function categoryKeyFromTx(row: MoneyUiTx): string {
  return row.categoryId ?? row.category ?? 'uncategorized';
}

export function rescaleCategorySlices(slices: CategorySlice[]): CategorySlice[] {
  const grand = slices.reduce((s, row) => s + row.amount, 0);
  if (grand <= 0) return [];
  return slices.map((slice) => ({
    ...slice,
    pct: (slice.amount / grand) * 100,
  }));
}

export function applyCategoryExclusions(
  report: MonthlyReportView,
  excludedExpenseKeys: ReadonlySet<string>,
  excludedIncomeKeys: ReadonlySet<string>,
): MonthlyReportView {
  if (excludedExpenseKeys.size === 0 && excludedIncomeKeys.size === 0) {
    return report;
  }

  const excludedExpense = report.categoryExpense
    .filter((slice) => excludedExpenseKeys.has(slice.key))
    .reduce((sum, slice) => sum + slice.amount, 0);
  const excludedIncome = report.categoryIncome
    .filter((slice) => excludedIncomeKeys.has(slice.key))
    .reduce((sum, slice) => sum + slice.amount, 0);

  const income = Math.max(0, report.income - excludedIncome);
  const expense = Math.max(0, report.expense - excludedExpense);
  const net = income - expense;

  return {
    ...report,
    income,
    expense,
    net,
    savingsRatePct: income > 0 ? ((income - expense) / income) * 100 : null,
    incomeChangePct: null,
    expenseChangePct: null,
    netChangePct: null,
    categoryExpense: rescaleCategorySlices(
      report.categoryExpense.filter((slice) => !excludedExpenseKeys.has(slice.key)),
    ),
    categoryIncome: rescaleCategorySlices(
      report.categoryIncome.filter((slice) => !excludedIncomeKeys.has(slice.key)),
    ),
  };
}

function buildCategorySlicesLocal(rows: MoneyUiTx[]): CategorySlice[] {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const row of rows) {
    const key = categoryKeyFromTx(row);
    const label =
      row.category?.trim() ||
      (row.categoryId ? `Kategori ${row.categoryId}` : 'Tanpa kategori');
    const prev = totals.get(key);
    totals.set(key, {
      label: prev?.label ?? label,
      amount: (prev?.amount ?? 0) + row.amount,
    });
  }
  const grand = [...totals.values()].reduce((s, r) => s + r.amount, 0);
  if (grand <= 0) return [];
  return [...totals.entries()]
    .map(([key, row], index) => ({
      key,
      label: row.label,
      amount: row.amount,
      pct: (row.amount / grand) * 100,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function prevYearMonth(year: string, month: string): {
  year: string;
  month: string;
} {
  let y = Number(year);
  let m = Number(month) - 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return { year: String(y), month: String(m).padStart(2, '0') };
}

export function changePct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function formatChangePct(pct: number | null): string {
  if (pct == null) return 'n/a';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
}

export function sumByKind(
  rows: MoneyUiTx[],
  kind: 'income' | 'expense',
): number {
  return rows
    .filter((r) => r.kind === kind)
    .reduce((s, r) => s + r.amount, 0);
}

export function buildDailySeries(
  rows: MoneyUiTx[],
  year: string,
  month: string,
  daysInMonth: number,
): DayPoint[] {
  const byDay = new Map<number, { income: number; expense: number }>();
  for (let d = 1; d <= daysInMonth; d += 1) {
    byDay.set(d, { income: 0, expense: 0 });
  }
  for (const row of rows) {
    if (row.kind !== 'income' && row.kind !== 'expense') continue;
    const day = Number(row.dateIso.slice(8, 10));
    if (!byDay.has(day)) continue;
    const bucket = byDay.get(day)!;
    if (row.kind === 'income') bucket.income += row.amount;
    else bucket.expense += row.amount;
  }
  let cumulative = 0;
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const bucket = byDay.get(day)!;
    const net = bucket.income - bucket.expense;
    cumulative += net;
    return {
      dateIso: `${year}-${month}-${String(day).padStart(2, '0')}`,
      day,
      income: bucket.income,
      expense: bucket.expense,
      net,
      cumulativeNet: cumulative,
    };
  });
}

export function buildPersonBars(rows: MoneyUiTx[]): PersonBar[] {
  const map = new Map<string, PersonBar>();
  for (const row of rows) {
    if (row.kind !== 'income' && row.kind !== 'expense') continue;
    const key = row.personId || 'unknown';
    const prev = map.get(key) ?? {
      personId: key,
      label: row.person || '—',
      income: 0,
      expense: 0,
    };
    if (row.kind === 'income') prev.income += row.amount;
    else prev.expense += row.amount;
    map.set(key, prev);
  }
  return [...map.values()].sort(
    (a, b) => b.income + b.expense - (a.income + a.expense),
  );
}

export function buildPocketBars(rows: MoneyUiTx[]): PocketBar[] {
  const map = new Map<string, PocketBar>();
  for (const row of rows) {
    if (row.kind !== 'income' && row.kind !== 'expense') continue;
    const key = row.pocketId || row.pocket || 'unknown';
    const label = row.pocket?.trim() || 'Tanpa kantong';
    const prev = map.get(key) ?? { key, label, income: 0, expense: 0 };
    if (row.kind === 'income') prev.income += row.amount;
    else prev.expense += row.amount;
    map.set(key, prev);
  }
  return [...map.values()].sort((a, b) => b.expense - a.expense);
}

export function buildMovesSummary(rows: MoneyUiTx[]): MovesSummary {
  let transferCount = 0;
  let transferAmount = 0;
  let cashCount = 0;
  let cashAmount = 0;
  for (const row of rows) {
    if (row.kind === 'transfer') {
      transferCount += 1;
      transferAmount += row.amount;
    } else if (row.kind === 'cash_withdrawal') {
      cashCount += 1;
      cashAmount += row.amount;
    }
  }
  return { transferCount, transferAmount, cashCount, cashAmount };
}

export function downloadMonthlyCsv(input: {
  periodLabel: string;
  scopeLabel: string;
  income: number;
  expense: number;
  net: number;
  prevIncome: number;
  prevExpense: number;
  prevNet: number;
  categories: Array<{ label: string; amount: number; pct: number }>;
  pockets: PocketBar[];
  moves: MovesSummary;
}): void {
  const lines: string[] = [
    `Laporan evaluasi bulanan`,
    `Periode,${csvEscape(input.periodLabel)}`,
    `Scope,${csvEscape(input.scopeLabel)}`,
    '',
    `Metrik,Bulan ini,Bulan lalu`,
    `Pemasukan,${input.income},${input.prevIncome}`,
    `Pengeluaran,${input.expense},${input.prevExpense}`,
    `Selisih,${input.net},${input.prevNet}`,
    '',
    `Kategori,Jumlah,Persen`,
    ...input.categories.map(
      (c) =>
        `${csvEscape(c.label)},${c.amount},${c.pct.toFixed(1)}`,
    ),
    '',
    `Kantong,Pemasukan,Pengeluaran`,
    ...input.pockets.map(
      (p) => `${csvEscape(p.label)},${p.income},${p.expense}`,
    ),
    '',
    `Transfer count,${input.moves.transferCount}`,
    `Transfer amount,${input.moves.transferAmount}`,
    `Cash withdrawal count,${input.moves.cashCount}`,
    `Cash withdrawal amount,${input.moves.cashAmount}`,
  ];
  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `money-report-${input.periodLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
