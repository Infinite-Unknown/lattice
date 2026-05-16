import dotenv from 'dotenv';
// Next.js loads .env.local automatically; for this standalone tsx script we load it explicitly.
dotenv.config({ path: '.env.local' });
dotenv.config(); // also picks up .env if present
import { upsertActor } from '@/lib/data/actors';
import { upsertRelationship } from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { listAccounts } from '@/lib/data/accounts';
import { SEED_ACTORS, SEED_RELATIONSHIPS, SEED_OUTCOMES } from './seed-data';

/**
 * Seed data into a SPECIFIC tenant. Reads the target account id from:
 *   1. SEED_ACCOUNT_ID env var
 *   2. --account-id <id> CLI flag
 *   3. The first account that exists (if there is exactly one) — convenience
 *      for the common single-tenant local dev case.
 *
 * Refuses to run if multiple accounts exist and no explicit target is given.
 * That guards against the obvious foot-gun: seeding mock data into a
 * production tenant by accident.
 */
async function resolveAccountId(): Promise<string> {
  const fromEnv = process.env.SEED_ACCOUNT_ID;
  if (fromEnv?.trim()) return fromEnv.trim();

  const cliIdx = process.argv.indexOf('--account-id');
  if (cliIdx !== -1 && process.argv[cliIdx + 1]) return process.argv[cliIdx + 1];

  const accounts = await listAccounts();
  if (accounts.length === 0) {
    throw new Error('No accounts exist. Sign up at /sign-up first, then re-run seed.');
  }
  if (accounts.length === 1) {
    console.log(`Only one account exists — seeding into '${accounts[0].name}' (${accounts[0].id}).`);
    return accounts[0].id;
  }
  throw new Error(
    `${accounts.length} accounts exist — pick one with SEED_ACCOUNT_ID=acc_xxx or --account-id acc_xxx:\n` +
    accounts.map(a => `  ${a.id}  ${a.name}`).join('\n'),
  );
}

async function main() {
  const accountId = await resolveAccountId();
  console.log(`Seeding ${SEED_ACTORS.length} actors, ${SEED_RELATIONSHIPS.length} relationships, ${SEED_OUTCOMES.length} outcomes into ${accountId}`);

  for (const a of SEED_ACTORS) await upsertActor({ ...a, account_id: accountId });
  for (const r of SEED_RELATIONSHIPS) await upsertRelationship({ ...r, account_id: accountId });
  for (const o of SEED_OUTCOMES) await upsertOutcome({ ...o, account_id: accountId });

  console.log('Seed complete');
}
main().catch(e => { console.error(e); process.exit(1); });
