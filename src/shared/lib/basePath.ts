/** Vite `base` as router basename — `/family` when deployed behind reverse proxy. */
export function getRouterBasename(): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return '/';
  return base.replace(/\/$/, '');
}

/** Absolute browser path for hard redirects (`window.location`). */
export function withBasePath(path: string): string {
  const basename = getRouterBasename();
  if (!path.startsWith('/')) return path;
  if (basename === '/') return path;
  return `${basename}${path}`;
}

/** Public asset URL under Vite `base` (e.g. `/family/templates/...`). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}
