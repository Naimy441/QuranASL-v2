// Tiny spaced-repetition scheduler (SM-2 style) kept in localStorage — "quranki".
export interface Card { id: string; ease: number; interval: number; due: number; reps: number; best: number }
const KEY = "qasl-srs";

export function loadCards(): Record<string, Card> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
function save(c: Record<string, Card>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {}
}

/** grade: 0 again, 1 hard, 2 good, 3 easy */
export function review(id: string, grade: 0 | 1 | 2 | 3, score = 0): Card {
  const all = loadCards();
  const c = all[id] ?? { id, ease: 2.5, interval: 0, due: 0, reps: 0, best: 0 };
  if (grade === 0) {
    c.reps = 0;
    c.interval = 0;
  } else {
    c.reps += 1;
    c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round(c.interval * c.ease);
    if (grade === 3) c.interval = Math.round(c.interval * 1.3) + 1;
  }
  c.ease = Math.max(1.3, c.ease + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)));
  c.due = Date.now() + c.interval * 86400000 + (grade === 0 ? 60000 : 0);
  c.best = Math.max(c.best, score);
  all[id] = c;
  save(all);
  return c;
}

/** Order a deck: due/new cards first, then the rest by due date. */
export function orderDeck(ids: string[]): string[] {
  const cards = loadCards();
  const now = Date.now();
  return [...ids].sort((a, b) => {
    const ca = cards[a], cb = cards[b];
    const da = ca ? ca.due : 0, db = cb ? cb.due : 0;
    const dueA = da <= now, dueB = db <= now;
    if (dueA !== dueB) return dueA ? -1 : 1;
    return da - db;
  });
}
