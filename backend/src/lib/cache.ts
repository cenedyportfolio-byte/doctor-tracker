interface Entry<T> {
  value: Promise<T>;
  expiresAt: number;
}

/**
 * Small in-process TTL cache used for expensive aggregations (dashboard stats).
 *
 * Concurrent callers for the same key share one in-flight promise, so a burst of dashboard
 * loads triggers a single aggregation. Writes call `clear()` so data is never stale after a
 * mutation made through this API instance. With several API instances this would move to
 * Redis, keyed the same way.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs: number) {}

  async getOrSet(key: string, factory: () => Promise<T>): Promise<T> {
    if (this.ttlMs <= 0) return factory();

    const now = Date.now();
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > now) return cached.value;

    const value = factory();
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
    // Never cache failures.
    value.catch(() => this.entries.delete(key));
    return value;
  }

  clear(): void {
    this.entries.clear();
  }
}
