import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/current-user';
import { getAdminDb } from '@/lib/firebase-admin';
import { writeAuditEntry } from '@/lib/data/audit';

export const runtime = 'nodejs';

/**
 * One-shot tenant-claim backfill. The original Lattice instance was
 * single-tenant: every entity in actors / relationships / proposals /
 * outcomes was created without an account_id field. After the multi-root
 * migration, those records become orphaned — queries that filter on
 * account_id don't match them.
 *
 * This endpoint lets a root user stamp the caller's account_id onto every
 * unscoped record. Use case: the original root signs in, hits this once,
 * and reclaims all the data they created before the migration.
 *
 * Guardrails:
 *  - root-only (not even admins)
 *  - DRY-RUN by default: POST {} returns counts only
 *  - real run: POST {confirm: true} actually stamps records
 *  - never overwrites an existing account_id — only stamps where missing
 *  - writes an audit entry with the counts
 *
 * Surface intentionally small. Not enough authorization gradations to
 * make it part of the normal IAM UI — a root that needs this can curl it
 * or hit the dev console.
 *
 *   curl -X POST /api/admin/backfill                  # dry-run
 *   curl -X POST /api/admin/backfill -d '{"confirm":true}'  # do it
 */
export async function POST(req: Request) {
  const auth = await requireUser([]);
  if ('error' in auth) return auth.error;
  if (auth.user.type !== 'root') {
    return NextResponse.json({ error: 'root only' }, { status: 403 });
  }
  const targetAccountId = auth.user.account_id;

  const body = await req.json().catch(() => ({}));
  const dryRun = !(body as { confirm?: boolean }).confirm;

  const db = getAdminDb();
  const collections = ['actors', 'relationships', 'proposals', 'outcomes'];
  const result: Record<string, { unscoped: number; stamped: number }> = {};

  for (const col of collections) {
    const snap = await db.collection(col).get();
    let unscoped = 0;
    let stamped = 0;
    const batch = db.batch();
    let batchSize = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.account_id) continue;
      unscoped++;
      if (!dryRun) {
        batch.update(doc.ref, { account_id: targetAccountId });
        batchSize++;
        // Firestore batch cap is 500 ops — commit early if we hit it.
        if (batchSize >= 400) {
          await batch.commit();
          stamped += batchSize;
          batchSize = 0;
        }
      }
    }
    if (!dryRun && batchSize > 0) {
      await batch.commit();
      stamped += batchSize;
    }
    result[col] = { unscoped, stamped: dryRun ? 0 : stamped };
  }

  const totalUnscoped = Object.values(result).reduce((s, c) => s + c.unscoped, 0);
  const totalStamped = Object.values(result).reduce((s, c) => s + c.stamped, 0);

  if (!dryRun && totalStamped > 0) {
    await writeAuditEntry(
      auth.user, 'edit_actor', 'actor', 'backfill',
      `Tenant backfill · claimed ${totalStamped} previously-unscoped records into account ${targetAccountId}: ${
        Object.entries(result).map(([c, v]) => `${c}=${v.stamped}`).join(', ')
      }`,
    );
  }

  return NextResponse.json({
    dryRun,
    targetAccountId,
    totalUnscoped,
    totalStamped,
    perCollection: result,
    hint: dryRun
      ? `Found ${totalUnscoped} unscoped records. Re-POST with {"confirm":true} to claim them for this account.`
      : `Stamped ${totalStamped} records with account_id=${targetAccountId}.`,
  });
}
