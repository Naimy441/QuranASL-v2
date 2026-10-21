"""OCR the burned-in English subtitles of Global Deaf Muslim surah videos.

The surah videos (Surah 100-114 and Al-Fatiha) carry the translation, phrase by
phrase, as yellow text near the bottom of the frame. Isolating yellow pixels and
reading the band with Tesseract gives a timed subtitle track that scripts/gdm/align.ts
aligns to the ayat.

usage: .venv-mocap/bin/python -I scripts/gdm/ocr_subtitles.py OUT_DIR VIDEO [VIDEO ...] [--fps 4]
--white reads white captions instead (writes <stem>.white.subs.json).
Writes OUT_DIR/<stem>.subs.json: {"video", "fps", "subs": [[start, end, text], ...]}
"""
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np

args = sys.argv[1:]
fps = 4.0
white = False
if "--white" in args:  # white captions (e.g. the Al-Fatiha demo) instead of yellow
    white = True
    args.remove("--white")
if "--fps" in args:
    i = args.index("--fps")
    fps = float(args[i + 1])
    del args[i : i + 2]
out_dir, videos = args[0], args[1:]
os.makedirs(out_dir, exist_ok=True)


def read(png, tmp):
    im = cv2.imread(png)
    h = im.shape[0]
    y0 = int(h * (0.8 if white else 0.6))  # subtitles live in the lower part of the frame
    band = im[y0:]
    b, g, r = (band[:, :, k].astype(int) for k in range(3))
    if white:
        m = ((r > 232) & (g > 232) & (b > 232)).astype(np.uint8) * 255
    else:
        m = ((r > 140) & (g > 140) & (b < 110) & (abs(r - g) < 70)).astype(np.uint8) * 255
    if m.sum() < 255 * 150:
        return ""
    ys, xs = np.nonzero(m)
    # the subtitle is the lowest dense run of yellow rows
    rows = np.bincount(ys, minlength=m.shape[0])
    dense = np.nonzero(rows > 3)[0]
    if not len(dense):
        return ""
    m = m[max(0, dense.min() - 6) : dense.max() + 6]
    m = cv2.dilate(m, np.ones((2, 2), np.uint8))
    img = 255 - cv2.resize(m, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    f = png + ".m.png"
    cv2.imwrite(f, img)
    r = subprocess.run(["tesseract", f, "-", "--psm", "6"], capture_output=True, text=True)
    return " ".join(r.stdout.split())


for video in videos:
    stem = os.path.splitext(os.path.basename(video))[0]
    out = os.path.join(out_dir, stem + (".white" if white else "") + ".subs.json")
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", video, "-vf", f"fps={fps}", os.path.join(tmp, "f%06d.png")], check=True)
        files = sorted(os.path.join(tmp, f) for f in os.listdir(tmp) if f.endswith(".png"))
        with ThreadPoolExecutor(max_workers=6) as ex:
            texts = list(ex.map(lambda f: read(f, tmp), files))
    # merge consecutive frames with (near-)identical text into timed subtitles
    subs = []
    for i, t in enumerate(texts):
        ts = i / fps
        if not t:
            continue
        if subs and (subs[-1][2] == t or (abs(len(subs[-1][2]) - len(t)) < 3 and ts - subs[-1][1] < 0.6)) and ts - subs[-1][1] < 0.6:
            subs[-1][1] = round(ts + 1 / fps, 2)
            if len(t) > len(subs[-1][2]):
                subs[-1][2] = t
        else:
            subs.append([round(ts, 2), round(ts + 1 / fps, 2), t])
    json.dump({"video": stem, "fps": fps, "subs": subs}, open(out, "w"), indent=0)
    print(stem, len(files), "frames", len(subs), "subtitles", flush=True)
