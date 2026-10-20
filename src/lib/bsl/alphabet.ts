// British Sign Language two-handed manual alphabet (right-handed signer).
// The non-dominant (left) hand is the "base": open, palm toward the signer,
// fingers up and angled toward the dominant side. Vowels are the dominant index
// touching a base fingertip (A thumb, E index, I middle, O ring, U little).
// Shapes marked "low" in BSL_LETTER_CONF need checking by a BSL user.
import { compileSign } from "../asl/dsl";
import { combineSigns } from "../asl/lexicon";
import type { CompiledSign } from "../asl/types";

const BASE = "5 @fs:i6d2 p:B f:UI";
const BASE_PALM_UP = "B @fs:i6d6 p:U f:FI";

const L: Record<string, string> = {
  A: `1 @base.tipT:o1 p:D f:I at:tipI | ${BASE}`,
  E: `1 @base.tipI:o1 p:D f:I at:tipI | ${BASE}`,
  I: `1 @base.tipM:o1 p:D f:I at:tipI | ${BASE}`,
  O: `1 @base.tipR:o1 p:D f:I at:tipI | ${BASE}`,
  U: `1 @base.tipP:o1 p:D f:I at:tipI | ${BASE}`,
  B: `O @fs:o1 p:I f:U at:radial | O @fs:o1 p:I f:U at:radial`,
  C: `C @fs:o4 p:I f:U`,
  D: `C @base.pipI:o2 p:I f:U at:radial | 1 @fs:i6 p:O f:U`,
  F: `H @base.pipI:o1 p:D f:I | H @fs:i6 p:B f:UI`,
  G: `S @base.knuckles:u2 p:I f:F | S @fs:i4d4 p:O f:F`,
  H: `B @base.heel p:D f:I at:palm > @base.tipM at:palm d:0.15 | ${BASE_PALM_UP}`,
  J: `1 @base.tipM:o1 p:D f:I at:tipI > @base.heel:o1 at:tipI ~arc:o2 d:0.2 | ${BASE}`,
  K: `X @base.pipI:o1 p:D f:I at:pipI | 1 @fs:i6 p:B f:UI`,
  L: `1 @base.palm:u1 p:D f:FI at:tipI | ${BASE_PALM_UP}`,
  M: `B @base.palm:u1 p:D f:FI at:tipM | ${BASE_PALM_UP}`,
  N: `U @base.palm:u1 p:D f:FI at:tipI | ${BASE_PALM_UP}`,
  P: `O @base.pipI p:I f:F at:tipI | 1 @fs:i6 p:B f:UI`,
  Q: `O @base.palm:u2 p:D f:D at:tipI | ${BASE_PALM_UP}`,
  R: `X @base.palm:u1 p:D f:FI at:pipI | ${BASE_PALM_UP}`,
  S: `I @base.tipP:o1 p:B f:I at:tipP | I @fs:i6 p:B f:O`,
  T: `1 @base.ulnar:o1 p:D f:I at:tipI | ${BASE}`,
  V: `V @base.palm:o1 p:I f:FI at:tipI | ${BASE}`,
  W: `5 @base.palm:o2 p:B f:UI | 5 @fs:i6 p:F f:UO`,
  X: `1 @base.pipI:o1 p:F f:UI at:pipI | 1 @fs:i6 p:B f:UI`,
  Y: `1 @base.tipT:o1d2 p:D f:I at:tipI | L @fs:i6 p:B f:UI`,
  Z: `4 @base.palm:o1 p:I f:FI at:tipM | ${BASE}`,
};

export const BSL_LETTER_CONF: Record<string, "med" | "low"> = Object.fromEntries(
  Object.keys(L).map((k) => [k, "AEIOUCHLMNVTFG".includes(k) ? "med" : "low"]),
);

const LETTER_HOLD = 0.12;

function letter(ch: string): CompiledSign {
  const def = L[ch];
  return compileSign("BSL-fs:" + ch, def.replace(/(\| )/, ` h:${LETTER_HOLD} $1`) + (def.includes("|") ? "" : ` h:${LETTER_HOLD}`));
}

/** Fingerspell a word with the BSL two-handed alphabet. */
export function bslFingerspell(word: string): CompiledSign {
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "").split("");
  if (!letters.length) return letter("A");
  return combineSigns("bsl-fs:" + word.toUpperCase(), letters.map(letter));
}

export const BSL_LETTERS = Object.keys(L);
