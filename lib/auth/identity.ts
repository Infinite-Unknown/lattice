/**
 * Firebase Auth identifies every user by an email. Root users use a real one.
 * IAM users don't have an email — they sign in with a username — so we mint
 * a synthetic email under our private TLD purely to satisfy Firebase Auth's
 * password machinery. The user never sees it, never types it.
 *
 *   IAM "aisha-mentor" in account "acc_abcd1234" →
 *     aisha-mentor@acc-abcd1234.lattice.invalid
 *
 * Notes:
 *  - The `.invalid` TLD is reserved by RFC 2606 — guaranteed never to
 *    collide with a real domain.
 *  - Hostname labels (per RFC 952/1123) can't contain underscores, so we
 *    map our `acc_xxx` IDs to `acc-xxx` for the email's domain part. Without
 *    this, Firebase Auth rejects createUser with `auth/invalid-email`.
 */

const SYNTHETIC_DOMAIN_TLD = 'lattice.invalid';

function accountIdToHostnameLabel(accountId: string): string {
  // RFC 952/1123: hostnames are [a-z0-9-], no underscores.
  return accountId.replace(/_/g, '-').toLowerCase();
}

export function syntheticEmailForIam(accountId: string, username: string): string {
  return `${username.toLowerCase()}@${accountIdToHostnameLabel(accountId)}.${SYNTHETIC_DOMAIN_TLD}`;
}

export function isSyntheticIamEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith('.' + SYNTHETIC_DOMAIN_TLD);
}
