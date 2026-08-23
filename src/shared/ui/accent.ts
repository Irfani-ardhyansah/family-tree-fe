export type SuiteAccent = 'roots' | 'core' | 'money' | 'admin';

export const ACCENT = {
  roots: {
    primary:
      'bg-primary-500 shadow-[0_8px_16px_-6px_rgba(106,168,106,0.45)] hover:bg-primary-600',
    focus: 'focus:border-primary-500',
    toggleOn: 'bg-primary-500',
    stepActive: 'bg-primary-500',
    stepDone: 'bg-primary-500/50',
  },
  core: {
    primary:
      'bg-sky-600 shadow-[0_8px_16px_-6px_rgba(2,132,199,0.45)] hover:bg-sky-700',
    focus: 'focus:border-sky-500',
    toggleOn: 'bg-sky-600',
    stepActive: 'bg-sky-600',
    stepDone: 'bg-sky-600/50',
  },
  money: {
    primary:
      'bg-money-brown shadow-[0_8px_16px_-6px_rgba(91,124,153,0.45)] hover:bg-money-brown-deep',
    focus: 'focus:border-money-brown',
    toggleOn: 'bg-money-brown',
    stepActive: 'bg-money-brown',
    stepDone: 'bg-money-brown/50',
  },
  admin: {
    primary:
      'bg-admin-600 shadow-[0_8px_16px_-6px_rgba(13,148,136,0.45)] hover:bg-admin-700',
    focus: 'focus:border-admin-500',
    toggleOn: 'bg-admin-600',
    stepActive: 'bg-admin-600',
    stepDone: 'bg-admin-600/50',
  },
} as const;
