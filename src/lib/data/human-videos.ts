// Human-signed reference videos on YouTube (embedded, never downloaded for display).
// ASL: Global Deaf Muslim (youtube.com/@gdeafmuslim). BSL: Qur'an in BSL playlist.
export interface HumanVideo { id: string; lang: "ASL" | "BSL"; source: string; title: string }

const GDM = "Global Deaf Muslim";
const BSL = "Qur'an in British Sign Language";

const ASL_VIDEOS: Record<number, string[]> = {
  1: ["dd4HJD9RucY", "kqpG-3VV7GM"],
  100: ["QV2MH06B1UE"], 101: ["fyfF-FkbiXQ"], 102: ["Vsiz2dN_M-o"], 103: ["3IfSTN-Eptg"],
  104: ["mkmcMIFN_A0"], 105: ["1-hrlQ20eUU"], 106: ["B2MlbTM8Ol0"], 107: ["1HgMc2ZMt00"],
  108: ["eJeHiLF4sBM"], 109: ["gLRKhHzE8M4", "ZHGtUuFo4Eg"], 110: ["_KVSt3h9tUA"], 111: ["ZgDdcXNlJgA"],
  112: ["JuPnR__ENd4"], 113: ["ZEJ7UuHgRlc"], 114: ["Gl1WVAiHhwo", "-S_PlNVe_qk"],
};

const BSL_VIDEOS: Record<number, string> = {
  1: "LzmqNY5lLrM", 36: "ucRkZIm3QH4", 67: "psv4H-HiZNA", 68: "fc0QXDUGysE", 69: "c8lAQ4f70rY",
  70: "2L7rgCsmHB0", 71: "THnIZ3e0mZE", 72: "6lYZOF_i2vs", 73: "4f_AhyPgHqI", 74: "O1LGk7umhIk",
  75: "V-G9dBQeksU", 76: "sROx7aJES_g", 77: "6nQdGtQ9wLk", 78: "or3VZvb_CQM", 79: "j5SgkQe9ezM",
  80: "kpoHidP9bzo", 81: "_tnzvKbvOHw", 82: "6N3592ecNEI", 83: "PYCpXHAvxhI", 84: "TbxUZcppvXQ",
  85: "BL7IVCOhI_k", 86: "PyskYlgP9rA", 87: "RaF1xGeM8GQ", 88: "K15kZp34XkY", 89: "03qd7ynrvcA",
  90: "livEzMpVUEc", 91: "O0E_NDfHUQE", 92: "Y_ZYp00Z7fg", 93: "ab35b8fAFBY", 94: "-nO1JkSU5e0",
  95: "Jml8EVJbdUc", 96: "6uSTVBd5GfQ", 97: "w9IcV0Co8jc", 98: "hXcrpj9Pb1A", 99: "4RW-fR5LQJU",
  100: "GgI5emRR4IM", 101: "ESdDZHZucYs", 102: "kk5DAficNVQ", 103: "-7oq9952LYo", 104: "1Tz9V4UxP9w",
  105: "4n8pBxHU_Vk", 106: "mYdJibJJwD0", 107: "XQGhjqtwtRo", 108: "DsDfKg4aB6c", 109: "M2mxtlj4f0g",
  110: "Z7yTaBup7lA", 111: "W19vpdJkTCI", 112: "MXJMXzPvJ50", 113: "uje7XqZgCOc", 114: "VreLW5eMY-s",
};

export function humanVideos(surah: number): HumanVideo[] {
  const out: HumanVideo[] = [];
  for (const id of ASL_VIDEOS[surah] ?? []) out.push({ id, lang: "ASL", source: GDM, title: `Surah ${surah} in ASL` });
  if (BSL_VIDEOS[surah]) out.push({ id: BSL_VIDEOS[surah], lang: "BSL", source: BSL, title: `Surah ${surah} in BSL` });
  return out;
}
