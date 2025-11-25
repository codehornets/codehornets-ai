---
description: Clean up workspace (Docker images, volumes, temp files)
tags: [cleanup, maintenance, disk]
---

Perform workspace cleanup:

1. Show current disk usage: `df -h /home/anga/workspace/dev`
2. Check Docker disk usage: `docker system df`
3. Clean temporary files:
   - List .tmp contents: `ls -lah .tmp/ 2>/dev/null`
   - Check size: `du -sh .tmp/`
4. Identify large files: `find . -type f -size +100M 2>/dev/null | grep -v data/`
5. Check for old log files: `find . -name "*.log" -type f -mtime +30 2>/dev/null`

Offer to clean:
- Remove .tmp/* (with confirmation)
- Prune Docker: `docker system prune -af --volumes` (with warning)
- Clean Laravel cache: `make artisan CMD="cache:clear"`
- Remove old vendor folders: `find effenco -type d -name vendor -mtime +90`

Provide before/after disk usage comparison.
