// Static-export base path. In production the app is served under
// /logo-animator/ on GitHub Pages — see next.config.ts. next/image with
// `unoptimized: true` does not auto-prefix basePath, so any string-based
// asset references must be wrapped in this helper.
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/logo-animator' : '';

export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
