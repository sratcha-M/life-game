#!/bin/bash
# แปลงไฟล์ .wav ที่อัปโหลดทั้งหมด → src/assets/voice/<ชื่อ>.mp3 แล้ว build single-file
U=/root/.claude/uploads/83c86084-1681-5050-8fb6-94b6b29e52bc
cd /home/claude/life-game
for src in $U/*.wav; do
  name=$(basename "$src" .wav); name=${name#*-}; [[ $name == test* ]] && continue
  [ -f src/assets/voice/$name.mp3 ] && [ src/assets/voice/$name.mp3 -nt "$src" ] && continue
  ffmpeg -y -v error -i "$src" -ac 1 -b:a 64k src/assets/voice/$name.mp3 && echo "+ $name"
done
echo "total: $(ls src/assets/voice/*.mp3 | wc -l)"
