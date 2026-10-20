"""Learn word-level BSL signs from the Al Isharah BSL Qur'an Project recordings.

Weakly supervised sign spotting: every segmented ayah (data/bsl/segments.json)
is a motion sequence paired with its English meaning. For a word w, ayat whose
English contains w are positives, others are negatives. A sign for w should be
a short motion that occurs in (almost) every positive and rarely elsewhere. We
search candidate windows cut from positive ayat, measure their best match in
every other ayah with subsequence DTW, and keep the window whose match
distances best separate positives from negatives (ROC AUC).

usage: python -I scripts/bsl/spot.py [--min-support 4] [--max-words 400]
Writes data/bsl/spot.json: { word: {video, start, end, auc, support, hits:[...]} }
"""
import json
import math
import os
import re
import sys
import unicodedata

import numpy as np

ROOT = os.getcwd()
args = sys.argv[1:]
MIN_SUPPORT = int(args[args.index("--min-support") + 1]) if "--min-support" in args else 4
MAX_WORDS = int(args[args.index("--max-words") + 1]) if "--max-words" in args else 400
ONLY = args[args.index("--only") + 1].split(",") if "--only" in args else None

STOP = set("""a an the of to and or but in on at by for with from as is are was were be been being am it its it's that this these
those which who whom whose what when where why how not no nor so then than there their they them he him his she her we us our
you your i me my mine will shall would should could can may might do does did done has have had o indeed verily upon unto
into out up down over under again also only even just very all any each every some such own same other another more most
said say says like if whether while until after before about against between through during without within among because
those whoever whatever thing things one ones make made let""".split())

FINGER = [(1, 2, 3, 4), (5, 6, 7, 8), (9, 10, 11, 12), (13, 14, 15, 16), (17, 18, 19, 20)]


def norm_word(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    w = re.sub(r"[^a-z']", "", w).strip("'")
    if w.endswith("'s"):
        w = w[:-2]
    for suf, rep in (("ies", "y"), ("ied", "y"), ("ing", ""), ("ness", ""), ("ed", ""), ("es", ""), ("s", "")):
        if len(w) > 4 and w.endswith(suf) and not w.endswith("ss"):
            return w[: -len(suf)] + rep
    return w


def angle(u, v):
    nu, nv = np.linalg.norm(u), np.linalg.norm(v)
    if nu < 1e-9 or nv < 1e-9:
        return 0.0
    return math.acos(max(-1.0, min(1.0, float(np.dot(u, v) / (nu * nv)))))


def hand_feats(h, w, hgt):
    """Handshape + orientation features from 21 image landmarks (x,y,z normalised)."""
    p = np.array([[a[0] * w, a[1] * hgt, a[2] * w] for a in h])
    size = np.linalg.norm(p[9] - p[0]) + 1e-6
    out = []
    for f in FINGER:
        a, b, c, d = f
        out.append(angle(p[b] - p[a], p[c] - p[b]) + angle(p[c] - p[b], p[d] - p[c]))
    out.append(np.linalg.norm(p[4] - p[8]) / size)  # thumb–index aperture
    out.append(np.linalg.norm(p[8] - p[12]) / size)  # index–middle spread
    fd = (p[9] - p[0]) / size
    pn = np.cross(p[5] - p[0], p[17] - p[0])
    pn = pn / (np.linalg.norm(pn) + 1e-9)
    return out + list(fd[:2]) + list(pn)


def frame_features(cap):
    """Per-frame feature matrix (T x D) with NaN where a hand is not tracked."""
    w, hgt = cap["w"], cap["h"]
    rows = []
    for f in cap["frames"]:
        pi = f.get("pi")
        if not pi:
            rows.append([np.nan] * 32)
            continue
        ls, rs = np.array(pi[11][:2]), np.array(pi[12][:2])
        mid = (ls + rs) / 2
        sw = np.linalg.norm(ls - rs) + 1e-6
        row = []
        for wi in (16, 15):  # signer's right (dominant) then left wrist
            row += list((np.array(pi[wi][:2]) - mid) / sw)
        # assign hands to wrists by proximity
        hands = [h for h in (f.get("lh"), f.get("rh")) if h]
        for wi in (16, 15):
            wpt = np.array(pi[wi][:2])
            best = None
            for h in hands:
                dd = np.linalg.norm(np.array(h[0][:2]) - wpt)
                if dd < 0.08 and (best is None or dd < best[0]):
                    best = (dd, h)
            row += hand_feats(best[1], w, hgt) if best else [np.nan] * 12
        rows.append(row)
    X = np.array(rows, dtype=np.float64)
    # forward/back fill short gaps per column
    for j in range(X.shape[1]):
        col = X[:, j]
        idx = np.where(~np.isnan(col))[0]
        if len(idx) == 0:
            X[:, j] = 0
            continue
        X[:, j] = np.interp(np.arange(len(col)), idx, col[idx])
    return X


# feature weights: dominant wrist pos (2), other wrist (2), dominant hand (14), other hand (14)
W = np.array([1.5, 1.5, 0.6, 0.6] + [1.0] * 7 + [0.8] * 5 + [0.0] * 2 + [0.35] * 7 + [0.25] * 5 + [0.0] * 2)[:32]


def subseq_dtw(C, S):
    """Best subsequence-DTW cost of every candidate C[k] (K x L x D) inside S (T x D).
    Step pattern: each candidate frame advances 0, 1 or 2 sequence frames (speed 0.5x..2x+)."""
    K, L, _ = C.shape
    T = S.shape[0]
    if T < 2:
        return np.full(K, np.inf)
    Cw = (C * W).reshape(K * L, -1)
    Sw = S * W
    d2 = (Cw ** 2).sum(1)[:, None] + (Sw ** 2).sum(1)[None, :] - 2 * Cw @ Sw.T
    cost = np.sqrt(np.maximum(d2, 0)).reshape(K, L, T)
    D = cost[:, 0, :].copy()  # open begin
    for i in range(1, L):
        prev = D
        m = prev.copy()
        m[:, 1:] = np.minimum(m[:, 1:], prev[:, :-1])
        m[:, 2:] = np.minimum(m[:, 2:], prev[:, :-2])
        D = cost[:, i, :] + m
    return D.min(axis=1) / L  # open end


def auc(pos, neg):
    pos, neg = np.asarray(pos), np.asarray(neg)
    if len(pos) == 0 or len(neg) == 0:
        return 0.5
    # probability a positive distance is smaller than a negative distance
    return float(((pos[:, None] < neg[None, :]).sum() + 0.5 * (pos[:, None] == neg[None, :]).sum()) / (len(pos) * len(neg)))


def main():
    segs = json.load(open(os.path.join(ROOT, "data/bsl/segments.json")))
    segs = [s for s in segs if s["ayah"] > 0 and s["conf"] >= 0.3]
    # English meaning per ayah
    text = {}
    for s in segs:
        key = (s["surah"], s["ayah"])
        if key in text:
            continue
        sur = json.load(open(os.path.join(ROOT, f"public/data/surah/{s['surah']}.json")))
        text[key] = sur["ayat"][s["ayah"] - 1]["en"]
    feats = {}
    for vid in sorted({s["video"] for s in segs}):
        cap = json.load(open(os.path.join(ROOT, f"data/pose/bsl/{vid}.json")))
        feats[vid] = (frame_features(cap), cap["fps"])
        print("features", vid, feats[vid][0].shape, flush=True)
    allX = np.concatenate([f[0] for f in feats.values()])
    mu, sd = allX.mean(0), allX.std(0) + 1e-6
    for vid in feats:
        X, fps = feats[vid]
        feats[vid] = ((X - mu) / sd, fps)

    items = []
    for s in segs:
        X, fps = feats[s["video"]]
        a, b = int(s["start"] * fps), int(s["end"] * fps)
        if b - a < 6:
            continue
        words = {norm_word(w) for w in re.split(r"[\s\-—,.;:!?\"“”()\[\]]+", text[(s["surah"], s["ayah"])]) if w}
        words = {w for w in words if len(w) > 2 and w not in STOP}
        items.append({"seg": s, "X": X[a:b], "fps": fps, "words": words})
    print("ayat:", len(items))

    from collections import Counter
    df = Counter(w for it in items for w in it["words"])
    vocab = [w for w, c in df.most_common() if c >= MIN_SUPPORT and c <= 0.4 * len(items)]
    if ONLY:
        vocab = [norm_word(w) for w in ONLY]
    vocab = vocab[:MAX_WORDS]
    print("vocab:", len(vocab))
    rng = np.random.default_rng(7)
    results = {}
    for wi, w in enumerate(vocab):
        P = [it for it in items if w in it["words"]]
        Nn = [it for it in items if w not in it["words"]]
        if len(P) < MIN_SUPPORT:
            continue
        N = [Nn[i] for i in rng.choice(len(Nn), size=min(len(Nn), max(30, 2 * len(P))), replace=False)]
        P_eval = P if len(P) <= 30 else [P[i] for i in rng.choice(len(P), 30, replace=False)]
        # candidate windows from the shortest positives (less material = less ambiguity)
        sources = sorted(P, key=lambda it: len(it["X"]))[:6]
        cands, meta = [], []
        for si, it in enumerate(sources):
            fps = it["fps"]
            for L in (int(round(0.5 * fps)), int(round(0.8 * fps)), int(round(1.1 * fps))):
                for st in range(0, len(it["X"]) - L + 1, 2):
                    cands.append(it["X"][st : st + L])
                    meta.append((si, st, L))
        if not cands:
            continue
        best = None
        # evaluate per window length (equal lengths batch together)
        by_len = {}
        for c, m in zip(cands, meta):
            by_len.setdefault(m[2], ([], []))
            by_len[m[2]][0].append(c)
            by_len[m[2]][1].append(m)
        for L, (cs, ms) in by_len.items():
            C = np.stack(cs)
            dpos = np.stack([subseq_dtw(C, it["X"]) for it in P_eval], axis=1)  # K x |P|
            dneg = np.stack([subseq_dtw(C, it["X"]) for it in N], axis=1)
            for k, (si, st, L_) in enumerate(ms):
                src = sources[si]
                own = [j for j, it in enumerate(P_eval) if it is src]
                pv = np.delete(dpos[k], own)
                score = auc(pv, dneg[k])
                # prefer windows with real motion
                if best is None or score > best[0]:
                    best = (score, si, st, L_, pv, dneg[k])
        if not best:
            continue
        score, si, st, L_, pv, nv = best
        it = sources[si]
        fps = it["fps"]
        s = it["seg"]
        thr = np.percentile(nv, 15)
        results[w] = {
            "video": s["video"],
            "start": round(s["start"] + st / fps, 2),
            "end": round(s["start"] + (st + L_) / fps, 2),
            "src": [s["surah"], s["ayah"]],
            "auc": round(score, 3),
            "support": len(P),
            "recall": round(float((pv < thr).mean()), 2) if len(pv) else 0,
        }
        print(f"[{wi + 1}/{len(vocab)}] {w:14s} support={len(P):3d} auc={score:.3f} recall={results[w]['recall']}", flush=True)
        if (wi + 1) % 20 == 0:
            json.dump(results, open(os.path.join(ROOT, "data/bsl/spot.json"), "w"), indent=0)
    json.dump(results, open(os.path.join(ROOT, "data/bsl/spot.json"), "w"), indent=0)
    print("learned", len(results))


if __name__ == "__main__":
    main()
