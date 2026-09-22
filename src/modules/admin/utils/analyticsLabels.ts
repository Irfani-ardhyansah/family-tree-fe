import type { AnalyticsOutboundChannel } from '@/modules/admin/analyticsTypes';

export const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  work: 'Work',
};

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  about: 'Tentang',
  work: 'Karya',
  reviews: 'Ulasan',
  beyond: 'Beyond',
  services: 'Layanan',
  process: 'Proses',
  faq: 'FAQ',
  contact: 'Kontak',
  career: 'Karier',
  professional: 'Profesional',
  freelance: 'Freelance',
  personal: 'Personal',
};

export const CLICK_LABELS: Record<string, string> = {
  nav_logo: 'Logo (~/irfan)',
  nav_toggle: 'Menu mobile',
  nav_about: 'Nav About',
  nav_work: 'Nav Work',
  nav_reviews: 'Nav Reviews',
  nav_services: 'Nav Services',
  nav_contact: 'Nav Contact',
  nav_all_work: 'Nav All work',
  cta_view_projects: 'CTA View projects (hero)',
  cta_start_project: 'CTA Start a project',
  cta_all_work: 'View all work',
  faq_item: 'FAQ',
  intro_skip: 'Skip intro',
  contact_email_cta: 'Contact email CTA',
  contact_wa_cta: 'Contact WhatsApp CTA',
  contact_email_link: 'Link email',
  contact_wa_link: 'Link WhatsApp',
  social_instagram: 'Instagram',
  work_back_home: 'Back to home',
  career_step: 'Career step',
  catalog_item: 'Catalog item',
};

export const EVENT_LABELS: Record<string, string> = {
  page_view: 'Lihat halaman',
  session_start: 'Mulai sesi',
  intro_shown: 'Intro tampil',
  intro_skipped: 'Intro dilewati',
  intro_completed: 'Intro selesai',
  section_view: 'Lihat section',
  scroll_depth: 'Kedalaman scroll',
  click: 'Klik',
  work_card_view: 'Lihat kartu karya',
  outbound_click: 'Klik outbound',
  engagement_heartbeat: 'Aktif',
};

export const CHANNEL_LABELS: Record<AnalyticsOutboundChannel, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
};

export const CHANNEL_TONES: Record<AnalyticsOutboundChannel, string> = {
  email: 'bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
  whatsapp: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  instagram: 'bg-violet-50 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200',
};

export const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Ponsel',
  desktop: 'Desktop',
  tablet: 'Tablet',
};

const HIDDEN_PROP_KEYS = new Set([
  'ip',
  'ip_hash',
  'user_agent',
  'ua',
  'userAgent',
]);

export function pageLabel(pageId: string | null | undefined): string {
  if (!pageId) return 'Semua halaman';
  return PAGE_LABELS[pageId] ?? pageId;
}

export function sectionLabel(sectionId: string): string {
  return SECTION_LABELS[sectionId] ?? sectionId;
}

export function clickLabel(elementId: string, fallback?: string | null): string {
  return CLICK_LABELS[elementId] ?? fallback?.trim() ?? elementId;
}

export function eventLabel(name: string): string {
  return EVENT_LABELS[name] ?? name.replace(/_/g, ' ');
}

export function channelLabel(channel: string): string {
  if (channel === 'email' || channel === 'whatsapp' || channel === 'instagram') {
    return CHANNEL_LABELS[channel];
  }
  return channel;
}

export function deviceLabel(device: string | null | undefined): string {
  if (!device) return '—';
  return DEVICE_LABELS[device] ?? device;
}

export function countryLabel(code: string | null | undefined, name?: string | null): string {
  const normalized = (code ?? '').toUpperCase();
  if (!normalized || normalized === 'OTHER' || normalized === 'XX' || normalized === 'ZZ') {
    return 'Lainnya';
  }
  if (name && /^other$/i.test(name)) return 'Lainnya';
  return name?.trim() || normalized;
}

export function referrerLabel(value: string | null | undefined): string {
  if (!value || value === '(direct)' || value === 'direct') return '(langsung)';
  try {
    const url = new URL(value);
    return url.host.replace(/^www\./, '') || value;
  } catch {
    return value;
  }
}

export function utmLabel(value: string | null | undefined): string {
  if (!value) return '(langsung)';
  return value;
}

export function isHiddenPropKey(key: string): boolean {
  return HIDDEN_PROP_KEYS.has(key);
}
