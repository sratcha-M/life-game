#!/bin/bash
# ใช้: scripts/add-voice-zips.sh <โฟลเดอร์ที่มี zip/wav ที่ได้จาก Google AI>
# แตก lifepath-voices-*.zip + แปลง wav → src/assets/voice/<ชื่อ>.mp3 (ข้าม test_* และไฟล์ที่มีแล้ว)
set -e
U=${1:?usage: add-voice-zips.sh <dir>}
T=$(mktemp -d)
cd "$(dirname "$0")/.."
for z in "$U"/*.zip; do [ -f "$z" ] && unzip -oq "$z" -d "$T"; done
cp "$U"/*.wav "$T"/ 2>/dev/null || true
n=0
for src in "$T"/*.wav; do
  [ -f "$src" ] || continue
  name=$(basename "$src" .wav); name=${name#*-}; [[ $name == test* ]] && continue
  [ -f src/assets/voice/$name.mp3 ] && continue
  ffmpeg -y -v error -i "$src" -ac 1 -b:a 56k -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse" src/assets/voice/$name.mp3 && n=$((n+1))
done
echo "added $n · total $(ls src/assets/voice/*.mp3 | wc -l)"
