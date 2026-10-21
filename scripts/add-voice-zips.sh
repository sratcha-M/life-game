#!/bin/bash
# แตกไฟล์ lifepath-voices-*.zip ที่อัปโหลด → แปลง wav เป็น mp3 ใส่ src/assets/voice (ข้าม test_*)
U=/root/.claude/uploads/83c86084-1681-5050-8fb6-94b6b29e52bc
T=/tmp/claude-0/-home-claude/83c86084-1681-5050-8fb6-94b6b29e52bc/scratchpad/vz
mkdir -p $T && cd /home/claude/life-game
for z in $U/*lifepath-voices-*.zip; do unzip -oq "$z" -d $T; done
n=0
for src in $T/*.wav; do
  name=$(basename "$src" .wav); [[ $name == test* ]] && continue
  [ -f src/assets/voice/$name.mp3 ] && continue
  ffmpeg -y -v error -i "$src" -ac 1 -b:a 56k -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse" src/assets/voice/$name.mp3 && n=$((n+1))
done
echo "added $n · total $(ls src/assets/voice/*.mp3 | wc -l)"
