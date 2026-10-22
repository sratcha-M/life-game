#!/usr/bin/env python3
"""ตัดคำสั่งสไตล์ที่ TTS อ่านออกเสียงนำหน้าบทพูด (เช่น "อ่านด้วยเสียงผู้บรรยายนุ่ม...")
ใช้: scripts/trim-voice-prefix.py <out_dir> <ไฟล์.wav ...>
หลักการ: คำสั่งถูกอ่านก่อน แล้วเว้นช่วงเงียบยาว ≥0.85 วินาที ค่อยเข้าบทพูด → ตัดทิ้งถึงช่วงเงียบนั้น
ไม่แน่ใจ (ไม่เจอช่วงเงียบ) จะไม่ตัดและแจ้งเตือน"""
import re, subprocess, sys, os

MIN_GAP, MIN_START = 0.85, 5.0
FILTER = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"

def cut_point(path):
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-af", "silencedetect=n=-38dB:d=0.35", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    for s, e in zip(starts, ends):
        if s >= MIN_START and e - s >= MIN_GAP:
            return e
    return None

out = sys.argv[1]
for p in sys.argv[2:]:
    name = re.sub(r"^[0-9a-f]{8}-", "", os.path.basename(p)[:-4])
    t = cut_point(p)
    args = ["ffmpeg", "-y", "-v", "error"] + (["-ss", f"{t:.2f}"] if t else []) + ["-i", p, "-ac", "1", "-b:a", "56k", "-af", FILTER, f"{out}/{name}.mp3"]
    subprocess.run(args, check=True)
    print(f"{name}: cut at {t:.2f}s" if t else f"{name}: NO CUT (ไม่เจอช่วงเงียบคั่น)")
