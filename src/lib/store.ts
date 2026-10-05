// localStorage can be missing or throw (private mode, blocked site data): every access is
// guarded and the site works without it. Keys are prefixed "mb:".
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem('mb:' + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem('mb:' + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: nothing to remember, nothing breaks */
  }
}
