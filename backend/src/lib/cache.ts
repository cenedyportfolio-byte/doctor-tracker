interface Entry<T> {
  value: Promise<T>;
  expiresAt: number;
}

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
    value.catch(() => this.entries.delete(key));
    return value;
  }

  clear(): void {
    this.entries.clear();
  }
}
