import { PgClientLike } from '@/lib/server/postgres';

export async function recordModelUsage(
  db: PgClientLike,
  params: {
    modelName: string;
    modelType: 'language' | 'image';
    userId: string;
  }
): Promise<void> {
  const { modelName, modelType, userId } = params;

  await db.query(
    `
      INSERT INTO model_usage_records (id, model_name, model_type, user_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `,
    [crypto.randomUUID(), modelName, modelType, userId]
  );
}
