import type {
  MoneyAuditAction,
  MoneyAuditEntityType,
  MoneyAuditLogApi,
  MoneyAuditLogQuery,
  MoneyAuditLogListResult,
} from '@/modules/money-track/api/moneyApi';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

/** Dummy audit trail for layout / filter verification. */
export const moneyAuditMock: MoneyAuditLogApi[] = [
  {
    id: 'audit-1',
    createdAt: hoursAgo(1),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'create',
    entityType: 'transaction',
    entityId: '55',
    summary: 'Catat pengeluaran Makan Rp 85.000',
    before: null,
    after: {
      type: 'expense',
      amount: 85000,
      date: '2026-09-08',
      categoryName: 'Makan',
      note: 'Makan siang',
    },
  },
  {
    id: 'audit-2',
    createdAt: hoursAgo(3),
    actorPersonId: 2,
    actorName: 'Ayu',
    action: 'update',
    entityType: 'transaction',
    entityId: '48',
    summary: 'Ubah pengeluaran Transport Rp 25.000 → Rp 30.000',
    before: { amount: 25000, date: '2026-09-07' },
    after: { amount: 30000, date: '2026-09-07' },
  },
  {
    id: 'audit-3',
    createdAt: hoursAgo(6),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'create',
    entityType: 'transfer',
    entityId: '12',
    summary: 'Transfer ke Ayu Rp 3.000.000',
    before: null,
    after: {
      amount: 3000000,
      date: '2026-09-08',
      fromPocket: 'Transaksi · BCA',
      toPocket: 'Transaksi · Seabank',
    },
  },
  {
    id: 'audit-4',
    createdAt: daysAgo(1),
    actorPersonId: 2,
    actorName: 'Ayu',
    action: 'create',
    entityType: 'cash_withdrawal',
    entityId: '7',
    summary: 'Tarik tunai Rp 500.000',
    before: null,
    after: { amount: 500000, date: '2026-09-07', note: 'Belanja pasar' },
  },
  {
    id: 'audit-5',
    createdAt: daysAgo(1),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'create',
    entityType: 'category',
    entityId: '22',
    summary: 'Tambah kategori pengeluaran Kopi',
    before: null,
    after: { name: 'Kopi', type: 'expense', icon: 'coffee' },
  },
  {
    id: 'audit-6',
    createdAt: daysAgo(2),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'update',
    entityType: 'pocket',
    entityId: '101',
    summary: 'Ubah nama kantong Dompet → Transaksi',
    before: { name: 'Dompet' },
    after: { name: 'Transaksi' },
  },
  {
    id: 'audit-7',
    createdAt: daysAgo(2),
    actorPersonId: 2,
    actorName: 'Ayu',
    action: 'delete',
    entityType: 'category',
    entityId: '19',
    summary: 'Hapus kategori pengeluaran Lain-lain',
    before: { name: 'Lain-lain', type: 'expense' },
    after: null,
  },
  {
    id: 'audit-8',
    createdAt: daysAgo(3),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'create',
    entityType: 'opening_balance',
    entityId: 'batch-1',
    summary: 'Set saldo awal 4 kantong',
    before: null,
    after: {
      items: [
        { pocketId: 101, amount: 8450000 },
        { pocketId: 102, amount: 42100000 },
      ],
    },
  },
  {
    id: 'audit-9',
    createdAt: daysAgo(4),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'create',
    entityType: 'balancing_adjustment',
    entityId: 'adj-3',
    summary: 'Sesuaikan saldo Transaksi · BCA (selisih Rp −50.000)',
    before: { recordedBalance: 8450000 },
    after: { actualBalance: 8400000, diff: -50000, note: 'Selisih ATM' },
  },
  {
    id: 'audit-10',
    createdAt: daysAgo(5),
    actorPersonId: 2,
    actorName: 'Ayu',
    action: 'create',
    entityType: 'debt',
    entityId: '9',
    summary: 'Tambah piutang Budi Rp 800.000',
    before: null,
    after: {
      direction: 'piutang',
      counterpartyName: 'Budi',
      amount: 800000,
    },
  },
  {
    id: 'audit-11',
    createdAt: daysAgo(5),
    actorPersonId: 2,
    actorName: 'Ayu',
    action: 'create',
    entityType: 'debt_payment',
    entityId: '3',
    summary: 'Cicilan piutang Budi Rp 200.000',
    before: null,
    after: { debtId: 9, amount: 200000, date: '2026-09-03' },
  },
  {
    id: 'audit-12',
    createdAt: daysAgo(6),
    actorPersonId: 1,
    actorName: 'Irfan',
    action: 'create',
    entityType: 'account',
    entityId: '5',
    summary: 'Tambah account Jago',
    before: null,
    after: { name: 'Jago', type: 'bank' },
  },
];

function createdDateOnly(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function listMoneyAuditMock(
  query: MoneyAuditLogQuery = {},
): MoneyAuditLogListResult {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const q = query.q?.trim().toLowerCase() ?? '';

  let rows = moneyAuditMock.slice();

  if (query.actorPersonId) {
    const pid = String(query.actorPersonId);
    rows = rows.filter((r) => String(r.actorPersonId ?? '') === pid);
  }
  if (query.entityType) {
    rows = rows.filter((r) => r.entityType === query.entityType);
  }
  if (query.entityId) {
    rows = rows.filter((r) => r.entityId === String(query.entityId));
  }
  if (query.action) {
    rows = rows.filter((r) => r.action === query.action);
  }
  if (query.from) {
    rows = rows.filter((r) => createdDateOnly(r.createdAt) >= query.from!);
  }
  if (query.to) {
    rows = rows.filter((r) => createdDateOnly(r.createdAt) <= query.to!);
  }
  if (q) {
    rows = rows.filter((r) => {
      const hay =
        `${r.summary} ${r.actorName} ${r.entityId} ${r.entityType}`.toLowerCase();
      return hay.includes(q);
    });
  }

  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

export function getMoneyAuditMockById(id: string): MoneyAuditLogApi | null {
  return moneyAuditMock.find((r) => r.id === id) ?? null;
}

/** Re-export enums for mock consumers that only import this module. */
export type {
  MoneyAuditAction,
  MoneyAuditEntityType,
  MoneyAuditLogApi,
};
