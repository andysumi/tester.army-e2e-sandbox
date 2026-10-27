#!/bin/sh
# バグバッシュの実行（npx e2e guide bug-bash の「3. Fan out」にならう）
# bugbash/charters.txt のチャーターを 2 本ずつ並行で実行する。対象サイトに負荷をかけないため、公式の例（4 本）より少なくしている
# 結果は .e2e/bugbash/<slug>/ と .e2e/bugbash/<slug>.log に出る（.gitignore で除外）
set -u
cd "$(dirname "$0")/.."
[ -n "${ANTHROPIC_API_KEY:-}" ] || { echo "ANTHROPIC_API_KEY が未設定です" >&2; exit 2; }
export E2E_TELEMETRY_DISABLED=1
mkdir -p .e2e/bugbash
while IFS='|' read -r slug target agent charter; do
  [ -n "$slug" ] && printf '%s\0%s\0%s\0%s\0' "$slug" "$target" "$agent" "$charter"
done < bugbash/charters.txt | xargs -0 -n 4 -P 2 sh -c \
  'echo "start: $1"; npx e2e explore "$4" --config e2e.bugbash.config.ts --target "$2" --agent "$3" --output ".e2e/bugbash/$1" --max-steps 4 --debug --video=on --reporter list,markdown < /dev/null > ".e2e/bugbash/$1.log" 2>&1; echo "done: $1 (exit $?)"' _
echo "all done"
