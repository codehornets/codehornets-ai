---
description: Generate quick documentation for a service
tags: [documentation, generate, service]
---

Generate documentation for service specified in $ARGUMENTS (or intra if not specified):

1. Identify the service directory (e.g., effenco/intra/)
2. Read composer.json or package.json to understand dependencies
3. List main directories: `ls -la $SERVICE_DIR/`
4. Check for routes:
   - Laravel: `make artisan CMD="route:list"`
   - Or: `find $SERVICE_DIR -name "routes" -o -name "*Route*"`
5. Look for README: `cat $SERVICE_DIR/README.md 2>/dev/null`
6. Identify main controllers/entry points
7. Check for tests: `find $SERVICE_DIR -path "*/tests/*" -name "*.php" | wc -l`

Generate a service documentation template with:
- Service name and purpose
- Technology stack
- Dependencies
- Main entry points (routes/controllers)
- Configuration requirements
- Testing status
- TODO: sections to fill in
