#!/bin/bash
# 数据备份 —— 见 DATA_PROTECTION.md
#
# 只增不减：每次生成一个带时间戳的快照，不覆盖、不清理旧备份。
# 建议加到 crontab：0 * * * * /path/to/backup.sh

set -euo pipefail

DATA_DIR="${DATA_DIR:-/home/angelia_58/.openclaw/workspace/data/painting-psychology}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/angelia_58/.openclaw/workspace/data/painting-psychology-backups}"

if [ ! -d "$DATA_DIR" ]; then
  echo "数据目录不存在: $DATA_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
STAMP=$(date +%Y%m%d-%H%M%S)
DEST="$BACKUP_ROOT/$STAMP.tar.gz"

tar -czf "$DEST" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"

SESSIONS=$(find "$DATA_DIR/sessions" -name answers.json 2>/dev/null | wc -l)
REPORTS=$(find "$DATA_DIR/sessions" -name report.json 2>/dev/null | wc -l)

echo "备份完成: $DEST"
echo "  会话 $SESSIONS 个 / 报告 $REPORTS 份 / 大小 $(du -h "$DEST" | cut -f1)"
echo "  现有备份数: $(ls -1 "$BACKUP_ROOT"/*.tar.gz 2>/dev/null | wc -l)"
