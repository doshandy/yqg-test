import { toRaw } from 'vue';

export function safeClone<T>(value: T): T {
  const raw = toRaw(value) as T;
  try {
    return structuredClone(raw);
  } catch {
    return JSON.parse(JSON.stringify(raw)) as T;
  }
}
