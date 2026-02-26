# Neon Schema

This folder contains PostgreSQL schema files for the current Neon setup.

## Current schema

- `neon-schema.sql`

## Rebuild command

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/database/neon-schema.sql
```
