#!/bin/bash
# สร้างไฟล์ HTML ไฟล์เดียวสำหรับเผยแพร่: bash scripts/build-single.sh <outdir> <out.html>
set -e
cd "$(dirname "$0")/.."
OUT=${1:-/tmp/sdist}
SINGLE=1 npx vite build --outDir "$OUT" > /dev/null
python3 - "$OUT/index.html" "${2:-$OUT/life-path.html}" <<'EOF'
import sys
t = open(sys.argv[1]).read()
h = t.split('<meta charset="UTF-8" />', 1)[1].split('</head>', 1)[0]
b = t.split('<body>', 1)[1].rsplit('</body>', 1)[0]
open(sys.argv[2], 'w').write(h + b)
print('ok', len(h + b))
EOF
