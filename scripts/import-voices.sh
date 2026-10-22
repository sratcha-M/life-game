#!/bin/bash
# นำ mp3 จาก lifepath-voices-*.zip (ที่ voice-studio.html ดาวน์โหลดไว้) เข้า src/assets/voice
# ใช้: bash scripts/import-voices.sh [โฟลเดอร์ที่มี zip — ค่าเริ่มต้น ~/Downloads]
D=${1:-~/Downloads}
cd "$(dirname "$0")/.." || exit 1
before=$(ls src/assets/voice/*.mp3 | wc -l)
for z in "$D"/lifepath-voices-*.zip; do
  [ -f "$z" ] || continue
  unzip -oqj "$z" '*.mp3' -x 'test*' -d src/assets/voice 2>/dev/null && echo "+ $(basename "$z")"
done
echo "added $(( $(ls src/assets/voice/*.mp3 | wc -l) - before )) · total $(ls src/assets/voice/*.mp3 | wc -l)"
