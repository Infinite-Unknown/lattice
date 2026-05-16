/**
 * Firebase Auth identifies every user by an email. Our Root users use a real
 * email; our IAM users use a synthetic email derived from their account-scoped
 * username so Firebase Auth's password machinery still applies.
 *
 *   IAM "aisha-mentor" in account "acc_abcd1234" →
 *     iam+aisha-mentor@acc_abcd1234.lattice.invalid
 *
 * The `.invalid` TLD is reserved by RFC 2606 so it can never collide with a
 * real email. Clients translate username → synthetic email at sign-in time.
 */

const SYNTHETIC_DOMAIN_TLD = 'lattice.invalid';

export function syntheticEmailForIam(accountId: string, username: string): string {
  return `iam+${username.toLowerCase()}@${accountId}.${SYNTHETIC_DOMAIN_TLD}`;
}

export function isSyntheticIamEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith('.' + SYNTHETIC_DOMAIN_TLD) && email.startsWith('iam+');
}
