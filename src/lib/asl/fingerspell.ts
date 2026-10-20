import { compileSign } from "./dsl";
import type { CompiledSign } from "./types";

// Orientation and handshape per letter (right hand, fingerspelling space).
const LETTER: Record<string, string> = {
  A: "A p:F f:U", B: "B p:F f:U", C: "C p:I f:U", D: "D p:FI f:U", E: "E p:F f:U",
  F: "F p:F f:U", G: "G p:B f:I", H: "H p:B f:I", I: "I p:F f:U", K: "K p:F f:U",
  L: "L p:F f:U", M: "M p:F f:U", N: "N p:F f:U", O: "O p:I f:U", P: "P p:DB f:FD",
  Q: "Q p:B f:D", R: "R p:F f:U", S: "S p:F f:U", T: "T p:F f:U", U: "U p:F f:U",
  V: "V p:F f:U", W: "W p:F f:U", X: "X p:FI f:U", Y: "Y p:F f:U",
};

const LETTER_T = 0.13; // transition into a letter
const LETTER_H = 0.11; // hold on a letter

/** Build the DSL for fingerspelling a word. */
export function fingerspellDef(word: string): string {
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "").split("");
  const keys: string[] = [];
  letters.forEach((ch, i) => {
    const drift = `@fs:o${(i * 0.5).toFixed(1)}`;
    const d = i === 0 ? "" : ` d:${LETTER_T}`;
    const dbl = i > 0 && letters[i - 1] === ch;
    if (ch === "J") {
      keys.push(`I ${drift} p:F f:U${d} h:0.02`, `I ${drift}:d3i2 p:B f:UI d:0.18 h:${LETTER_H}`);
    } else if (ch === "Z") {
      keys.push(`1 ${drift}:u3i3 p:F f:U${d} h:0.02`, `1 ${drift}:u3o2 d:0.08 h:0`, `1 ${drift}:d2i3 d:0.1 h:0`, `1 ${drift}:d2o2 d:0.08 h:${LETTER_H}`);
    } else if (dbl) {
      // doubled letters: small slide outward
      keys.push(`${LETTER[ch]} ${drift}:o2 d:0.16 h:${LETTER_H}`);
    } else {
      keys.push(`${LETTER[ch]} ${drift}${d} h:${LETTER_H}`);
    }
  });
  return keys.join(" > ");
}

export function fingerspell(word: string): CompiledSign {
  return compileSign("fs:" + word.toUpperCase(), fingerspellDef(word));
}
