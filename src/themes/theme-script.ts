import type { Mode } from './palette'

/**
 * Pure mode resolution: a valid cookie wins, otherwise the system preference.
 * Must stay self-contained (no closures/imports): its source is embedded in
 * the anti-flash inline script via `toString()`.
 */
export function resolveMode(
  cookie: string | undefined,
  prefersDark: boolean,
): Mode {
  if (cookie === 'dark' || cookie === 'shiny') return cookie
  return prefersDark ? 'dark' : 'shiny'
}

/** Inline IIFE run in <head> before first paint to avoid a theme flash. */
export const themeScript: string = `(function(){try{var resolveMode=${resolveMode.toString()};var m=document.cookie.match(/(?:^|;\s*)mode=([^;]*)/);var c=m?m[1]:undefined;var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;e.setAttribute('data-theme','sombra');e.setAttribute('data-mode',resolveMode(c,d));e.classList.add('js');}catch(_){document.documentElement.setAttribute('data-theme','sombra');document.documentElement.setAttribute('data-mode','dark');}})();`
