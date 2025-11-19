---
description: Explore database schema and data
tags: [database, mysql, explore]
---

Explore the MySQL database:

1. List all databases:
```bash
docker exec db mysql -uroot -pEffe4020 -e "SHOW DATABASES;"
```

2. Show tables in effenco database:
```bash
docker exec db mysql -uroot -pEffe4020 effenco -e "SHOW TABLES;"
```

3. Get table counts:
```bash
docker exec db mysql -uroot -pEffe4020 effenco -e "
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'effenco'
ORDER BY table_rows DESC
LIMIT 20;"
```

4. Show database sizes:
```bash
docker exec db mysql -uroot -pEffe4020 -e "
SELECT table_schema AS 'Database',
ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
GROUP BY table_schema;"
```

5. If user provides a table name in $ARGUMENTS, describe it:
```bash
docker exec db mysql -uroot -pEffe4020 effenco -e "DESCRIBE $ARGUMENTS;"
```

Present the database structure and offer to explore specific tables or run queries.
