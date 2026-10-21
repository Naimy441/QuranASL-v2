#!/bin/bash
# Print a surah's English translation, one ayah per line (for hand-glossing).  scripts/en.sh 39
python3 -c "
import json,sys
s=json.load(open('public/data/surah/$1.json'))
print('#', s['n'], s['name'], s['ayahs'])
for a in s['ayat']: print(f\"{a['n']}: {a['en']}\")
"
