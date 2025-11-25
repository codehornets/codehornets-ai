---
description: Check workspace health and status
tags: [workspace, status, health]
---

Check the overall workspace health:

1. Run `make ps` to see running containers
2. Check disk usage with `du -sh data/* 2>/dev/null`
3. Verify git status with `git status`
4. Check Docker disk usage with `docker system df`
5. Show recent logs with `make logs | tail -50`
6. Verify all required services are running
7. Check for any error patterns in logs

Present a summary report with:
- Running services status
- Disk usage warnings (if > 20GB)
- Git branch and uncommitted changes
- Any critical errors in logs
- Recommendations for cleanup if needed
