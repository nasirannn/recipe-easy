# R2 Recipe Image Key Naming

## Naming Rule

Recipe image objects in `recipe-images` bucket use:

`recipes/{userId}/{recipeId}/{imageFile}.{ext}`

Example:

`recipes/fc98703d-a484-400b-bd7b-90706f037271/recipe-kxTv1RWRllB4-mlhrb8pl/img-xajZVxWbFgeF-mlhrimeg.jpg`

## Why This Structure

- `recipes/{userId}/{recipeId}`: clear ownership and recipe grouping.
- filename keeps uniqueness while staying readable.
- shorter path makes debugging and manual inspection easier.

## Historical Migration

1. Dry run:

```bash
npm run r2:migrate-keys:dry
```

2. Apply migration:

```bash
npm run r2:migrate-keys:apply
```

3. Optional controls:

```bash
node scripts/migrate-r2-recipe-image-keys.js --apply --limit=200
node scripts/migrate-r2-recipe-image-keys.js --apply --no-delete-old
```

## Required Environment Variables

- `DATABASE_URL`
- `R2_ENDPOINT`
- `R2_BUCKET_NAME_IMG` (should be `recipe-images`)
- `R2_ACCESS_KEY_ID_IMG`
- `R2_SECRET_ACCESS_KEY_IMG`
- `R2_PUBLIC_URL_IMG` or `NEXT_PUBLIC_R2_PUBLIC_URL_IMG`
