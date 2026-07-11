'use client';

/**
 * activeGameSaveRegistry — lets a currently-mounted game register a "flush
 * my save right now" callback that other parts of the app (outside the
 * game's own component tree) can call before doing something that tears
 * the game down without a normal page unload.
 *
 * Why this exists: useGameSave() already autosaves every ~15s and on
 * window 'beforeunload' / tab-hide. That covers a real browser tab close
 * or reload. It does NOT cover a Next.js client-side navigation (e.g. the
 * "Logout" button calling router.push('/login')) — that's a soft
 * navigation, so 'beforeunload' never fires, and the <iframe> (and all its
 * in-memory game state) is destroyed the instant IframeGame unmounts.
 *
 * IframeGame registers its saveNow() here on mount and unregisters on
 * unmount. Anything that navigates away from a page that might have a
 * game in progress (currently: the employee sidebar's Logout button)
 * calls flushActiveGameSave() first and awaits it, guaranteeing the last
 * known state reaches Supabase before the game unmounts.
 *
 * Safe no-op when no game is mounted (most pages, most of the time).
 */

type FlushFn = () => Promise<void>;

let activeFlush: FlushFn | null = null;

export function registerActiveGameSave(flush: FlushFn): void {
  activeFlush = flush;
}

export function unregisterActiveGameSave(flush: FlushFn): void {
  // Only clear if we're unregistering the flush that's currently active —
  // guards against a stale unmount clobbering a newer game's registration.
  if (activeFlush === flush) {
    activeFlush = null;
  }
}

export async function flushActiveGameSave(): Promise<void> {
  if (!activeFlush) return;
  try {
    await activeFlush();
  } catch {
    // Best-effort — logout should never be blocked by a save failure.
  }
}
