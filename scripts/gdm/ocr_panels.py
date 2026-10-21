"""OCR the white text panel of Global Deaf Muslim "Final" surah videos.

These videos show a page of the translation at a time on the right ("104:1 - Woe to
every slanderer ..."), so the ayah references on screen tell which ayat the signer
is signing during that page, not which single ayah. scripts/gdm/align.ts splits each
page among its ayat using the signer's own pauses.

usage: .venv-mocap/bin/python -I scripts/gdm/ocr_panels.py OUT_DIR VIDEO [VIDEO ...] [--fps 2]
Writes OUT_DIR/<stem>.panels.json: {"video", "fps", "pages": [[start, end, [ayah, ...], text], ...]}
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np

args = sys.argv[1:]
fps = 2.0
if "--fps" in args:
    i = args.index("--fps")
    fps = float(args[i + 1])
    del args[i : i + 2]
out_dir, videos = args[0], args[1:]
REF = re.compile(r"(\d{1,3})\s*[:;.]\s*(\d{1,3})")


def read(png):
    im = cv2.imread(png)
    w = im.shape[1]
    panel = im[:, int(w * 0.5) :]
    m = (panel.min(axis=2) > 185).astype(np.uint8) * 255
    if m.sum() < 255 * 300:
        return ""
    img = 255 - cv2.resize(m, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    f = png + ".p.png"
    cv2.imwrite(f, img)
    r = subprocess.run(["tesseract", f, "-", "--psm", "6"], capture_output=True, text=True)
    return " ".join(r.stdout.split())


for video in videos:
    stem = os.path.splitext(os.path.basename(video))[0]
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", video, "-vf", f"fps={fps}", os.path.join(tmp, "f%06d.png")], check=True)
        files = sorted(os.path.join(tmp, f) for f in os.listdir(tmp) if f.endswith(".png"))
        with ThreadPoolExecutor(max_workers=6) as ex:
            texts = list(ex.map(read, files))
    frames = []
    for i, t in enumerate(texts):
        refs = sorted({int(a) for s, a in REF.findall(t) if 1 <= int(a) <= 300})
        low = t.lower()
        kind = "refs" if refs else ("intro" if ("name of" in low or "surah" in low) else "")
        frames.append((i / fps, kind, tuple(refs), t))
    # pages: runs of frames showing the same set of references (or the intro), tolerating OCR dropouts
    pages = []
    for ts, kind, refs, t in frames:
        if not kind:
            continue
        key = refs if kind == "refs" else ("intro",)
        if pages and ts - pages[-1][1] <= 2.0 and (pages[-1][2] == list(key) or (kind == "refs" and pages[-1][2] != ["intro"] and len(set(refs) & set(pages[-1][2])) >= max(1, len(refs) // 2))):
            pages[-1][1] = round(ts + 1 / fps, 2)
            if kind == "refs" and len(refs) > len(pages[-1][2]):
                pages[-1][2] = list(refs)
                pages[-1][3] = t
        else:
            pages.append([round(ts, 2), round(ts + 1 / fps, 2), list(key), t])
    pages = [p for p in pages if p[1] - p[0] >= 1.5]
    json.dump({"video": stem, "fps": fps, "pages": pages}, open(os.path.join(out_dir, stem + ".panels.json"), "w"), indent=0)
    print(stem, [(p[0], p[1], p[2]) for p in pages], flush=True)
