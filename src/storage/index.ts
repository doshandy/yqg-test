const noop = () => {};

export default class Storage<T = unknown> {
  private key: string;
  private cb: (event: StorageEvent) => void = noop;
  private storage: globalThis.Storage;

  constructor(key: string, useSessionStorage = false) {
    this.key = key;
    this.storage = useSessionStorage ? sessionStorage : localStorage;
  }

  set(cache: T) {
    this.storage.setItem(this.key, JSON.stringify(cache));
  }

  get(): T | null {
    try {
      const raw = this.storage.getItem(this.key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  remove() {
    this.storage.removeItem(this.key);
  }

  on(fn: (event: StorageEvent) => void) {
    this.cb = (event: StorageEvent) => {
      if (event.key === this.key && typeof fn === 'function') {
        fn(event);
      }
    };
    window.addEventListener('storage', this.cb);
  }

  off(needsRemove = false) {
    window.removeEventListener('storage', this.cb);
    this.cb = noop;
    if (needsRemove) this.remove();
  }
}
