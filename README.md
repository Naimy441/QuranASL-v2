# QuranASL

The meanings of the Qur'an in American Sign Language and British Sign Language, ayah by ayah, signed by a 3D avatar — with the Arabic, an English translation, human signer videos where they exist, webcam practice, and a studio where Deaf reviewers can correct everything. Light, dark and high-contrast themes, a reduce-motion setting and full keyboard control of the player.

> **Status: draft for Deaf community review.** No sign or translation here has been verified by Deaf ASL translators yet. Islamic terms should follow community signs (Global Deaf Muslim, Muhsen). Treat everything as a scaffold for human translators, not a replacement for them.

## What's in it

| Page | What it does |
| --- | --- |
| `/` | Landing page with a live signer, language/signer picker and "continue where you left off"; all 114 surahs by surah or juz, with search, filters and per-surah BSL coverage. |
| `/surah/[n]` | Ayah-by-ayah viewer: ASL/BSL switch, four signers, 3D or 2D, focus mode, speed control, scrubbing, keyboard shortcuts, gloss chips coloured by confidence, Arabic + word-by-word + roots, embedded human ASL (Global Deaf Muslim) and BSL videos, WebXR "View in VR/AR", `?ayah=` deep links. |
| `/dictionary` | 1,340 ASL signs and 243 learned BSL signs, searchable by gloss or English, with previews and fingerspelling of any word. |
| `/practice` | Webcam practice with spaced repetition. MediaPipe Hand Landmarker runs in a Web Worker; joint angles (θ = arccos(u·v/‖u‖‖v‖)), palm normal (cross product) and wrist path (dynamic time warping) are compared to the avatar's sign. Video never leaves the browser. |
| `/studio` | Gloss Studio: drag gloss chips to reorder, swap sign variants, set loci, toggle facial grammar, edit the sign definition itself — the avatar updates instantly. Edits stay in the browser; export them as JSON, or (in dev) write them straight into `data/gloss`. |

## Coverage

- **Hand-glossed ASL (all 6,236 ayat, 114 surahs):** every ayah has a hand-written gloss in `data/gloss/`; every token (75k) maps to a dictionary sign. None of it is Deaf-reviewed yet. The rule-based converter (`src/lib/asl/autogloss.ts`) remains as a fallback for ayat removed from the hand glosses.
- **Human BSL (999 ayat, 47 surahs):** Al Isharah's BSL Qur'an Project recordings, cut at each ayah (OCR of the on-screen ayah labels) and retargeted onto the avatar. Four playlist videos are unavailable on YouTube, so those surahs have no capture.
- **BSL dictionary (243 signs):** signs spotted automatically in those recordings (weakly supervised subsequence DTW against the English). Surahs without a recording get a rough BSL draft built only from these signs, labelled as a draft in the UI.
- **Motion-captured community signs (72):** Islamic terms from Global Deaf Muslim's "40 Islamic Signs" clips and the names of the 25 prophets, retargeted onto the avatar (see below). Where a capture exists it replaces the hand-built sign; the drawn version stays available as a `.drawn` variant.

## How it works

```
data/gloss/NNN.txt      hand-written ASL gloss, one line per ayah
        │  scripts/build-gloss.ts (validates every token against the dictionary)
        ▼
public/data/gloss/N.json ── autogloss fills the gaps (scripts/build-autogloss.ts)
        │
src/lib/asl/gloss.ts     parse gloss → tokens (signs, fs:, loci, NMS spans, pauses)
src/lib/asl/lexicon/*    dictionary: one line per sign in a small notation (below)
src/lib/asl/dsl.ts       compile a sign → timed keyframes per hand (IK-ready wrist pose,
                         orientation quaternion, handshape joint angles, overlays)
src/lib/asl/mocap.ts     captured signs → dense linearly-interpolated keyframes + face track
src/lib/asl/timeline.ts  join signs with human-timed transitions (Fitts law fitted to captures),
                         minimum-jerk movement, pass-through velocities (coarticulation),
                         paths bent around the body, staggered finger timing, settle + micro-motion
src/lib/asl/physical.ts  body SDF matching the avatar (head + headwear, nose, neck, torso, drape),
                         hand collision proxies, contact fitting at compile time, runtime solver
                         that keeps hands out of the body and each other
src/lib/avatar/*         procedural avatar: articulated hands (15 finger joints + thumb),
                         two-bone arm IK with learned / captured elbow swivel and torso clearance,
                         brows/lids/gaze/mouth/cheeks, head & torso
src/lib/avatar/learned.json  parameters learned from human signing (scripts/learn/motion-stats.ts)
src/components/avatar/AvatarCanvas.tsx   React Three Fiber renderer (+ @react-three/xr)
```

### Sign notation (dictionary entries)

```
KNOW  | B @temple p:B f:IU at:tipM > @temple:o3 d:0.1 ;x2 | know,knew | high
HELP  | 10 @base.palm at:ulnar p:I f:F > @base.palm at:ulnar d:0.35 | B @neutral:d4 p:U f:FI > @neutral:u8 d:0.35 | help | high
```

Keyframes are separated by `>`; the non-dominant hand follows `|`. Each key has a handshape (A–Y, 1–10, bentB, claw5, flatO, …), a location (`@chin`, `@neutral:f5u3`, `@^shoulder`, `@base.palm` = the other hand), palm/finger directions (`p:` `f:` with U D F B I O), the contact point (`at:tipI`), timing (`d:` `h:`), and motion overlays (`~arc ~circle ~wiggle ~twist ~shake ~tap`). Flags: `sym`, `alt`, `x2`, `face:browUp=.6`. Compounds: `=WOMAN+MARRY`. The Studio's sign editor documents all of it.

### Gloss notation (ayat)

`[top: NAME ALLAH] , GRACIOUS , MERCIFUL .` — signs, `fs:` fingerspelling, `SIGN:a` loci, `SIGN+` repetition, `A+B` compounds, `[tag: …]` facial grammar (`top yn wh rhq cond neg aff emph awe sad happy warn fear mm cha oo puff th rs-a rs-b rs-c gaze-*`), `, . ? !` pauses.

## Running

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
```

### Data pipelines

```bash
node scripts/fetch-quran.mjs          # Quran.com API → data/raw (gitignored)
node scripts/build-quran-data.mjs     # → public/data/surah/*.json (+ Quranic Arabic Corpus roots)
npx tsx scripts/build-gloss.ts        # validate hand glosses, report missing signs
npx tsx scripts/build-autogloss.ts    # draft every remaining ayah, report unknown words
npx tsx scripts/check-lexicon.ts      # compile every sign
npx tsx scripts/check-collisions.ts   # flag two-handed signs whose hands overlap
```

Motion capture (Python 3.12 venv, MediaPipe Holistic):

```bash
python3.12 -m venv .venv-mocap && .venv-mocap/bin/pip install "mediapipe==0.10.21" "protobuf==4.25.5" "numpy<2" opencv-python-headless
.venv-mocap/bin/python -I scripts/mocap/extract_pose.py data/pose/gdm path/to/clips/*.mov
npx tsx scripts/mocap/retarget.ts data/pose/gdm data/mocap/gdm-map.json public/data/mocap
```

Optional Claude-assisted glossing of un-glossed ayat (uses your Anthropic credentials and spends API credit; output is validated against the dictionary and still needs review):

```bash
npx tsx scripts/llm-gloss.ts 18 --from 1 --to 10           # print drafts
npx tsx scripts/llm-gloss.ts 18 --from 1 --to 10 --write   # merge into data/gloss/018.txt
```

BSL (Al Isharah recordings in `data/video/bsl/*.mp4`):

```bash
scripts/bsl/process_all.sh                    # OCR ayah labels + pose extraction for every video
npx tsx scripts/bsl/segment.ts                # → data/bsl/segments.json (ayah boundaries)
npx tsx scripts/bsl/retarget-ayat.ts          # → public/data/bsl/ayat/*.json
.venv-mocap/bin/python -I scripts/bsl/spot.py # spot recurring signs → data/bsl/spot.json
npx tsx scripts/bsl/build-lexicon.ts [minAUC] # → public/data/bsl/lexicon/*.json
```

`scripts/build-autogloss.ts` also writes `public/data/stats.json` (the numbers on the landing page). `scripts/en.sh N` prints a surah's English, one ayah per line, for glossing.

### Physical plausibility and motion

Hands never pass through the head, hijab, torso or each other:

- **At compile time** (`dsl.ts`): a key that touches the body keeps its contact point and the hand is tilted about it, by the smallest angle that clears the face, neck or chest, as a signer tilts the wrist; contact targets inside the clothed body move onto its surface; two-handed keys are settled so the hands touch instead of overlapping.
- **When sequencing** (`timeline.ts`): any movement whose straight path would cut through the body is bent into an arc around it.
- **Every frame** (`AvatarRig.apply`): a solver translates each hand out of the body and separates the hands (least squares over all touching finger pairs; for captured signs, in depth only, the dimension monocular capture gets wrong), eased by a critically damped spring so touching hands settle instead of flickering. The elbow swings out if the arm would pass through the torso. Cost: ~50 µs per frame.

Motion is tuned to captured human signing: transition and movement times follow a Fitts law fitted to Global Deaf Muslim captures (the engine used to move twice as fast as people do), handshapes are moved halfway toward how real hands form them, the elbow follows the swivel human signers use, captured signs follow the signer's own elbow.

```bash
npx tsx scripts/learn/motion-stats.ts --report   # learn from every retargeted clip → src/lib/avatar/learned.json
npx tsx scripts/learn/engine-stats.ts 150        # the same statistics measured on the engine, for comparison
npx tsx scripts/audit-signs.ts                   # physical audit of every sign → public/data/audit/signs.json
npx tsx scripts/audit-glosses.ts                 # coverage audit of every ayah → public/data/audit/*.json, review queue
npx tsx scripts/try-def.ts "<def>" ...            # score candidate sign definitions before editing the lexicon
npx tsx scripts/qa/smoothness.ts SIGN ...         # glitch detector: rendered vs raw hand acceleration, residual overlap
```

### Retargeting captured signing

`scripts/mocap/lib.ts` maps MediaPipe Holistic landmarks onto the avatar. x/y come from the image (anchored to the shoulders, and to the face for hands near the head), not from MediaPipe's world coordinates, which put the face 30% too low; depth comes from arm reach given the captured elbow angle; a hand overlapping the face in the video is placed on the avatar's face surface by the landmark actually touching it; hands seen over the torso are kept in front of it; tracking glitches are removed and the signal is smoothed with a zero-phase Gaussian. Each frame also carries the signer's elbow swivel.

```bash
npx tsx scripts/qa/retarget-range.ts data/pose/gdm/surah_fatihah.json 0 61 public/data/_qa/fatihah.json
node scripts/qa/compare.mjs path/to/video.mp4 /data/_qa/fatihah.json out.png "2,10,30"   # video | avatar side by side
```

### Review queue

`/review` ranks what Deaf reviewers should look at first: ayat whose gloss leaves part of the meaning uncarried, and the most-used signs whose motion still needs work, with links into the player, dictionary and Gloss Studio. Sign-offs merged into the repository go in `public/data/reviews.json`.

### Visual QA tools (headless Chrome)

```bash
node scripts/qa-signs.mjs out.png KNOW THINK MOTHER     # grid of signs at 35% / 75%
node scripts/frames.mjs "/lab/sign?gloss=ALLAH%20KNOW" out.png auto
node scripts/test-practice.mjs clip.y4m out.png         # Practice page with a video as the webcam
node scripts/snap.mjs "/surah/2?ayah=255" out.png 1280 860 4000 dark   # any page, size, wait, colour scheme
node scripts/qa/record.mjs "/lab/sign?gloss=ALLAH%20KNOW" out.mp4      # frame-exact MP4 of a lab page
```

## Sources, credits and licences

- Arabic text, word-by-word glosses, Saheeh International translation: [Quran.com API](https://api.quran.com).
- Roots and lemmas: Quranic Arabic Corpus (Kais Dukes), GPL — via [mustafa0x/quran-morphology](https://github.com/mustafa0x/quran-morphology).
- Human ASL videos: [Global Deaf Muslim](https://www.youtube.com/@gdeafmuslim) (embedded from YouTube). BSL videos and BSL motion: Al Isharah's BSL Qur'an Project.
- Captured Islamic signs and prophet names are retargeted from Global Deaf Muslim videos. **Before any public release, get Global Deaf Muslim's permission** to use their signs this way, and credit them in the app. **Likewise get Al Isharah's permission** before publishing the BSL motion and dictionary derived from their recordings.
- Hand tracking: MediaPipe (Apache-2.0), served locally from `public/mediapipe`.

## Reviewing

Every gloss and sign is a draft until a Deaf signer approves it.

- **`/review`** ranks what to look at first (from `public/data/audit/`) and shows real status: approved per surah, a *needs changes* view, who decided what. Every row opens the Studio at that ayah or sign.
- **`/studio`** is where things get fixed: watch the avatar beside the human-signed video, reorder signs by drag or keyboard (Alt+←/→), insert / change signs with the searchable picker, undo / redo, then **Approve** or **Needs changes** (optional comment). *Next in queue* jumps to the next flagged ayah or sign. In sign mode you can edit the definition (live compile check + physical check of how far a hand sinks into the body) or **record yourself** with the webcam (video + MediaPipe hand landmarks, saved as a proposed recording).
- Decisions are append-only events (`draft → needs-changes → approved`, with reviewer, time, comment and the exact gloss / definition), see `src/lib/review/`. They stay in the browser until exported as one **contribution bundle** (versioned JSON).

Merging a bundle:

```bash
npx tsx scripts/merge-contributions.ts bundle.json            # dry run: validate + diff
npx tsx scripts/merge-contributions.ts bundle.json --write    # apply
npx tsx scripts/build-gloss.ts                                # publish data/gloss → public/data/gloss
```

The merge refuses glosses with tokens missing from the lexicon, definitions that do not compile, and edits whose base changed in the repo since (`--force` overrides). It writes `data/gloss/*.txt`, `src/lib/asl/lexicon/*.ts`, `public/data/reviews.json`, and recordings to `data/contrib/recordings/` (with a `map.json` for `scripts/mocap/retarget.ts` after `extract_pose.py`). On the dev server the Studio's *Check for repo* button runs the same merge through `/api/studio`.

## Contributing

Deaf signers, interpreters and students: open any ayah in the **Gloss Studio**, fix the gloss or the sign, sign off the ayah with your name, and export your contributions. Signs marked *low* confidence in the dictionary are the most urgent to review.
