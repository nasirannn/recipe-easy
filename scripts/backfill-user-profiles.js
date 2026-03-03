#!/usr/bin/env node

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function normalizeDisplayName(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : null;
}

function normalizeAvatarUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 2048) : null;
}

function buildUiAvatarUrl(name) {
  const normalized = normalizeDisplayName(name) || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalized)}&background=0f172a&color=fff&size=150`;
}

function getEmailPrefixName(email) {
  if (typeof email !== 'string') {
    return null;
  }
  const prefix = email.split('@')[0];
  return normalizeDisplayName(prefix);
}

function pickDisplayNameFromUser(user, fallbackName) {
  const metadata = user?.user_metadata || {};
  return (
    normalizeDisplayName(metadata.display_name) ||
    normalizeDisplayName(metadata.full_name) ||
    normalizeDisplayName(metadata.name) ||
    getEmailPrefixName(user?.email) ||
    normalizeDisplayName(fallbackName)
  );
}

function pickAvatarUrlFromUser(user) {
  const metadata = user?.user_metadata || {};
  const metadataAvatar = normalizeAvatarUrl(metadata.avatar_url);
  if (metadataAvatar) {
    return metadataAvatar;
  }

  const metadataPicture = normalizeAvatarUrl(metadata.picture);
  if (metadataPicture) {
    return metadataPicture;
  }

  if (Array.isArray(user?.identities)) {
    for (const identity of user.identities) {
      const picture = normalizeAvatarUrl(identity?.identity_data?.picture);
      if (picture) {
        return picture;
      }
    }
  }

  return null;
}

async function ensureUserProfilesSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at
    ON user_profiles (updated_at DESC)
  `);
}

async function upsertUserProfile(db, userId, displayName, avatarUrl) {
  await db.query(
    `
      INSERT INTO user_profiles (user_id, display_name, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET
        display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
        avatar_url = CASE
          WHEN EXCLUDED.avatar_url IS NULL OR BTRIM(EXCLUDED.avatar_url) = ''
            THEN user_profiles.avatar_url
          WHEN EXCLUDED.avatar_url LIKE 'https://ui-avatars.com/%'
            AND user_profiles.avatar_url IS NOT NULL
            AND user_profiles.avatar_url NOT LIKE 'https://ui-avatars.com/%'
            THEN user_profiles.avatar_url
          ELSE EXCLUDED.avatar_url
        END,
        updated_at = NOW()
    `,
    [userId, displayName, avatarUrl]
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL');
  }
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  const db = new Client({ connectionString: databaseUrl });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await db.connect();
  try {
    await ensureUserProfilesSchema(db);

    const usersResult = await db.query(
      `
        SELECT
          r.user_id,
          MAX(NULLIF(BTRIM(r.author_name), '')) AS fallback_name
        FROM recipes r
        WHERE r.user_id IS NOT NULL
        GROUP BY r.user_id
      `
    );

    const users = usersResult.rows;
    if (users.length === 0) {
      console.log('No recipe owners found. Nothing to backfill.');
      return;
    }

    let processed = 0;
    let withAvatar = 0;
    let withDisplayName = 0;
    let missingInAuth = 0;
    let failed = 0;

    for (const row of users) {
      const userId = String(row.user_id || '').trim();
      if (!userId) {
        continue;
      }

      const fallbackName = normalizeDisplayName(row.fallback_name);
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        let displayName = fallbackName;
        let avatarUrl = null;

        if (error || !data?.user) {
          missingInAuth += 1;
        } else {
          displayName = pickDisplayNameFromUser(data.user, fallbackName);
          avatarUrl = pickAvatarUrlFromUser(data.user);
        }

        if (!avatarUrl) {
          avatarUrl = buildUiAvatarUrl(displayName || fallbackName || userId);
        }

        await upsertUserProfile(db, userId, displayName, avatarUrl);
        processed += 1;
        if (displayName) {
          withDisplayName += 1;
        }
        if (avatarUrl) {
          withAvatar += 1;
        }
      } catch (err) {
        failed += 1;
        console.error(`Failed to backfill user ${userId}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(
      JSON.stringify(
        {
          totalRecipeOwners: users.length,
          processed,
          withDisplayName,
          withAvatar,
          missingInAuth,
          failed,
        },
        null,
        2
      )
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
