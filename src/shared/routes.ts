/** FE route helpers — not backend API paths. */

export const appPaths = {
  launcher: '/',
  login: '/login',
  register: '/register',
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
} as const;

export const moneyPaths = {
  home: '/money',
} as const;

export const householdPaths = {
  home: '/home',
} as const;

export const modulePaths = {
  roots: rootsPaths.home,
  core: corePaths.home,
  money: moneyPaths.home,
  household: householdPaths.home,
} as const;
