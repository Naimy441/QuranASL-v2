"""Find which ayah is on screen in a BSL Qur'an Project video by OCR-ing the
caption panel (it carries a reference like "al-ikhlas 112:3").

usage: python -I ocr_ayah_labels.py VIDEO OUT.json [fps]
Output: {"video":..., "fps":..., "labels": [[t, surah, ayah] or [t, null, null, "bismillah"] ...]}
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

video, out = sys.argv[1], sys.argv[2]
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
REF = re.compile(r"(\d{1,3})\s*[:;.]\s*(\d{1,3})")

with tempfile.TemporaryDirectory() as tmp:
    # right half of the frame (caption panel), grayscale, 2x upscale for small text
    subprocess.run([
        "ffmpeg", "-nostdin", "-v", "error", "-i", video, "-vf",
        f"fps={fps},crop=iw*0.5:ih:iw*0.5:0,scale=iw*2:-1,format=gray",
        os.path.join(tmp, "f%06d.png"),
    ], check=True)
    files = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))

    def ocr(f):
        r = subprocess.run(["tesseract", os.path.join(tmp, f), "-", "--psm", "11"], capture_output=True, text=True)
        return f, r.stdout

    with ThreadPoolExecutor(max_workers=6) as ex:
        results = list(ex.map(ocr, files))

labels = []
for f, text in results:
    t = (int(f[1:7]) - 1) / fps
    low = text.lower()
    m = None
    for mm in REF.finditer(text):
        s, a = int(mm.group(1)), int(mm.group(2))
        if 1 <= s <= 114 and 1 <= a <= 286:
            m = (s, a)
    if m:
        labels.append([round(t, 2), m[0], m[1]])
    elif "name of god" in low or "entirely merciful" in low:
        labels.append([round(t, 2), None, None, "bismillah"])
json.dump({"video": os.path.basename(video), "fps": fps, "labels": labels}, open(out, "w"))
print(os.path.basename(video), len(files), "frames,", len(labels), "labelled")
