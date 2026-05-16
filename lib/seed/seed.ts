import 'dotenv/config';
import { upsertActor } from '@/lib/data/actors';
import { upsertRelationship } from '@/lib/data/relationships';
import { upsertOutcome } from '@/lib/data/outcomes';
import { SEED_ACTORS, SEED_RELATIONSHIPS, SEED_OUTCOMES } from './seed-data';

async function main() {
  console.log(`Seeding ${SEED_ACTORS.length} actors, ${SEED_RELATIONSHIPS.length} relationships, ${SEED_OUTCOMES.length} outcomes`);
  for (const a of SEED_ACTORS) await upsertActor(a);
  for (const r of SEED_RELATIONSHIPS) await upsertRelationship(r);
  for (const o of SEED_OUTCOMES) await upsertOutcome(o);
  console.log('Seed complete');
}
main().catch(e => { console.error(e); process.exit(1); });
