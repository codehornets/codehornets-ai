---
description: Debug a specific service (usage: /service-debug <service-name>)
tags: [debug, troubleshoot, service]
---

Debug the service specified in $ARGUMENTS:

1. Check if service container is running: `docker ps | grep $ARGUMENTS`
2. View recent logs: `docker logs $ARGUMENTS --tail=100`
3. Check container health: `docker inspect $ARGUMENTS | grep -A 20 Health`
4. Show environment variables: `docker exec $ARGUMENTS env`
5. Check resource usage: `docker stats $ARGUMENTS --no-stream`
6. Test connectivity (if web service): `docker exec $ARGUMENTS curl localhost || echo "Not a web service"`
7. Show running processes: `docker exec $ARGUMENTS ps aux`

Provide analysis:
- Is the service running?
- Any error patterns in logs?
- Resource constraints?
- Suggested fixes
