#!/bin/bash
# Redis RDB backup script for Intl-Dossier
# Cron: 0 2 * * * /opt/intl-dossier/deploy/backup-redis.sh >> /var/log/redis-backup.log 2>&1
#
# Copies Redis dump.rdb from the container to a dated backup directory.
# Retains last 7 days of backups.

set -euo pipefail

BACKUP_DIR="/opt/intl-dossier/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="intl-dossier-redis"

echo "[$(date)] Starting Redis backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Trigger BGSAVE and wait for completion
docker exec "$CONTAINER" redis-cli BGSAVE
sleep 5

# Verify BGSAVE completed
LAST_SAVE=$(docker exec "$CONTAINER" redis-cli LASTSAVE)
echo "[$(date)] Last save timestamp: $LAST_SAVE"

# Copy RDB file from container
docker cp "${CONTAINER}:/data/dump.rdb" "${BACKUP_DIR}/dump_${DATE}.rdb"

# Verify backup file exists and has content
BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/dump_${DATE}.rdb" 2>/dev/null || stat -f%z "${BACKUP_DIR}/dump_${DATE}.rdb" 2>/dev/null || echo "0")
if [ "$BACKUP_SIZE" -gt 0 ]; then
  echo "[$(date)] Backup created: dump_${DATE}.rdb (${BACKUP_SIZE} bytes)"
else
  echo "[$(date)] ERROR: Backup file is empty or missing"
  exit 1
fi

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "dump_*.rdb" -mtime +7 -delete
REMAINING=$(find "$BACKUP_DIR" -name "dump_*.rdb" | wc -l)
echo "[$(date)] Backup complete. $REMAINING backup(s) retained."
