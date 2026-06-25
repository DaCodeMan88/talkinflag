// Pure draft reconciliation — the cross-device "newest wins" decision used by
// useAutosaveDraft. Kept separate so it can be unit-tested without React/DOM.

export type StoredDraft<T> = { value: T; updatedAt: string } | null;

/**
 * Pick the draft to resume from when both a local (localStorage) and a server
 * (cross-device) draft may exist. The more recently updated draft wins; ties
 * favor the server as the cross-device source of truth. Returns null if
 * neither exists.
 */
export function reconcileDraft<T>(local: StoredDraft<T>, server: StoredDraft<T>): StoredDraft<T> {
  if (!local) return server;
  if (!server) return local;
  const localT = new Date(local.updatedAt).getTime();
  const serverT = new Date(server.updatedAt).getTime();
  return serverT >= localT ? server : local;
}
