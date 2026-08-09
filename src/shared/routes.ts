/** FE route helpers — not backend API paths. */

export const appPaths = {
  launcher: '/',
  login: '/login',
  register: '/register',
  inbox: '/inbox',
} as const;

export const rootsPaths = {
  home: '/roots',
  tree: '/roots/tree',
  data: '/roots/data',
  map: '/roots/map',
  events: '/roots/events',
  event: (id: string | number) => `/roots/events/${id}`,
  memoriam: '/roots/memoriam',
  memorial: (id: string | number) => `/roots/memoriam/${id}`,
  memorialPrayer: (id: string | number) => `/roots/memoriam/${id}/doa`,
} as const;

export const corePaths = {
  home: '/core',
  documents: '/core/documents',
  documentTypes: '/core/documents/types',
  documentNew: '/core/documents/new',
  document: (id: string | number) => `/core/documents/${id}`,
  documentEdit: (id: string | number) => `/core/documents/${id}/edit`,
  health: '/core/health',
  healthMember: (memberId: string | number) => `/core/health/${memberId}`,
  calendar: '/core/calendar',
  calendarEventTypes: '/core/calendar/types',
  calendarEvent: (id: string | number) => `/core/calendar/${id}`,
  calendarNew: '/core/calendar/new',
} as const;

export const moneyPaths = {
  home: '/money',
  transactions: '/money/transactions',
  pockets: '/money/pockets',
  reporting: '/money/reporting',
  /** Hidden from nav for now; route kept for later. */
  wishlist: '/money/wishlist',
  debts: '/money/debts',
  debtDetail: (id: string | number) => `/money/debts/${id}`,
  balancing: '/money/balancing',
  categories: '/money/categories',
  budgets: '/money/budgets',
  opening: '/money/opening',
  setup: '/money/setup',
  newTransaction: '/money/new/transaction',
  newTransfer: '/money/new/transfer',
  newMove: '/money/new/move',
  newCash: '/money/new/cash',
} as const;

export const householdPaths = {
  home: '/home',
} as const;

export const adminPaths = {
  home: '/admin',
  rbac: '/admin/rbac',
  modules: '/admin/modules',
  audit: '/admin/audit',
  sessions: '/admin/sessions',
  broadcast: '/admin/broadcast',
  settings: '/admin/settings',
  backup: '/admin/backup',
} as const;

export const modulePaths = {
  roots: rootsPaths.home,
  core: corePaths.home,
  money: moneyPaths.home,
  household: householdPaths.home,
  admin: adminPaths.home,
} as const;
