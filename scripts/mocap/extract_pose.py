"""Extract MediaPipe Holistic landmarks from sign videos.

usage: python3.12 -I scripts/mocap/extract_pose.py OUT_DIR VIDEO [VIDEO ...]
Writes OUT_DIR/<video-stem>.json with per-frame pose world landmarks, hand
landmarks (image coords + z), a subset of face landmarks and frame size.
"""
import json
import os
import sys

import cv2
import mediapipe as mp

FACE_IDX = [10, 152, 1, 13, 14, 61, 291, 105, 66, 107, 334, 296, 336, 159, 145, 386, 374, 33, 133, 362, 263, 234, 454, 168]


def r(v, n=4):
    return round(float(v), n)


def main():
    out_dir = sys.argv[1]
    os.makedirs(out_dir, exist_ok=True)
    holistic = mp.solutions.holistic.Holistic(
        static_image_mode=False, model_complexity=2, smooth_landmarks=True,
        refine_face_landmarks=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)
    for path in sys.argv[2:]:
        stem = os.path.splitext(os.path.basename(path))[0]
        out = os.path.join(out_dir, stem + ".json")
        if os.path.exists(out):
            print("skip", stem)
            continue
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frames = []
        while True:
            ok, img = cap.read()
            if not ok:
                break
            res = holistic.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            f = {}
            if res.pose_world_landmarks:
                f["pw"] = [[r(p.x), r(p.y), r(p.z), r(p.visibility, 2)] for p in res.pose_world_landmarks.landmark]
            if res.pose_landmarks:
                f["pi"] = [[r(p.x), r(p.y), r(p.z)] for p in res.pose_landmarks.landmark[:25]]
            if res.left_hand_landmarks:
                f["lh"] = [[r(p.x), r(p.y), r(p.z)] for p in res.left_hand_landmarks.landmark]
            if res.right_hand_landmarks:
                f["rh"] = [[r(p.x), r(p.y), r(p.z)] for p in res.right_hand_landmarks.landmark]
            if res.face_landmarks:
                lm = res.face_landmarks.landmark
                f["fc"] = [[r(lm[i].x), r(lm[i].y), r(lm[i].z)] for i in FACE_IDX]
            frames.append(f)
        cap.release()
        with open(out, "w") as fh:
            json.dump({"src": os.path.basename(path), "fps": fps, "w": w, "h": h, "faceIdx": FACE_IDX, "frames": frames}, fh)
        print("done", stem, len(frames), "frames", flush=True)


if __name__ == "__main__":
    main()
