#!/bin/bash
# OCR ayah labels + pose extraction for every downloaded BSL video (skips done ones).
# usage: scripts/bsl/process_all.sh   (run from the repo root)
set -u
PY=.venv-mocap/bin/python
mkdir -p data/bsl/ocr data/pose/bsl
ls data/video/bsl/*.mp4 > /tmp/qasl_bsl_list.txt
# OCR (cheap, sequential; each call is itself parallel)
while read -r v; do
  id=$(basename "$v" .mp4)
  [ -f "data/bsl/ocr/$id.json" ] || $PY -I scripts/bsl/ocr_ayah_labels.py "$v" "data/bsl/ocr/$id.json" 2
done < /tmp/qasl_bsl_list.txt  # (ffmpeg runs with -nostdin so it cannot eat this list)
# Pose extraction in 3 parallel workers
awk '{ print > ("/tmp/qasl_bsl_part_" (NR % 3)) }' /tmp/qasl_bsl_list.txt
for part in /tmp/qasl_bsl_part_*; do
  xargs $PY -I scripts/mocap/extract_pose.py --stride 2 --complexity 1 data/pose/bsl < "$part" 2>&1 | grep -E "^done|Error|Traceback" &
done
wait
rm -f /tmp/qasl_bsl_part_*
echo "all done: $(ls data/pose/bsl | wc -l) poses, $(ls data/bsl/ocr | wc -l) label files"
