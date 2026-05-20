export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  inputChars: number;
  outputChars: number;
}

const STORAGE_KEY = 'wechat-engine-history';
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(
  entry: Omit<HistoryEntry, 'id' | 'timestamp'>
): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const history = loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  history.unshift(newEntry);
  const trimmed = history.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
