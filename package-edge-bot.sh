#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
sed 's#from "npm:@supabase/supabase-js@2"#from "@supabase/supabase-js"#' supabase/functions/telegram-bot/shared/bot.ts > "$TMP/bot.ts"
cd "$TMP"
npm init -y >/dev/null 2>&1
npm install --silent @supabase/supabase-js@2 esbuild
npx esbuild bot.ts --bundle --platform=browser --format=esm --target=es2022 --outfile=bot.js
python3 - "$TMP/bot.js" "$ROOT/supabase/functions/telegram-bot/deploy-payload.ts" <<'PY'
import base64, gzip, pathlib, sys
src=pathlib.Path(sys.argv[1]).read_bytes()
encoded=base64.b64encode(gzip.compress(src, 9)).decode()
out=pathlib.Path(sys.argv[2])
out.write_text('''// Self-contained deployment payload for Masar Telegram Bot.\nconst encoded = "''' + encoded + '''";\nconst bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));\nconst source = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();\nfunction base64Utf8(text) { const bytes = new TextEncoder().encode(text); let binary = ""; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(binary); }\nawait import("data:text/javascript;base64," + base64Utf8(source));\n''')
print(f'compressed payload: {len(encoded)} base64 chars')
PY
wc -c "$ROOT/supabase/functions/telegram-bot/deploy-payload.ts"
